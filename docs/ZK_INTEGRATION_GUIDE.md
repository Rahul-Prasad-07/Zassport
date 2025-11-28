# Solana ZK Verification: Fundamentals & Debugging Guide

## 1. How Solana ZK Verification Works

### Core Concepts

**Solana's BN254 Syscalls:**
- Solana 1.18+ includes native BN254 (alt_bn128) curve operations
- Available syscalls: `alt_bn128_addition`, `alt_bn128_multiplication`, `alt_bn128_pairing`
- These are the same curve operations used by Ethereum for ZK proofs
- Verification takes ~200,000 compute units (very efficient!)

**Groth16 Protocol:**
- Groth16 is a zkSNARK proof system that's succinct and fast to verify
- Proof consists of: (A, B, C) - three elliptic curve points
- Verification key (VK) consists of: alpha, beta, gamma, delta, IC points
- Verification checks a pairing equation: `e(A,B) = e(α,β) * e(inputs,γ) * e(C,δ)`

### Data Format Requirements

**Key Format Details:**
1. **Endianness**: All data in BIG ENDIAN (BE) byte order
2. **Point Sizes**:
   - G1 points (curve BN254): 64 bytes uncompressed, 32 bytes compressed
   - G2 points (twisted curve): 128 bytes uncompressed, 64 bytes compressed
3. **G2 Point Ordering**: Components in "alt order" - (c1, c0) not (c0, c1)
4. **Public Inputs**: Each input is 32 bytes BE, must be < BN254 field size

**Critical: Proof A Negation**
- Groth16-solana expects proof A with NEGATED y-coordinate
- This is because the pairing equation uses -A in the verification
- Formula: `A_negated.y = (FIELD_PRIME - A.y) mod FIELD_PRIME`

## 2. Standard Integration Pattern

### With circom-prover (Recommended)

```rust
use circom_prover::{CircomProver, prover::ProofLib, witness::WitnessFn};
use groth16_solana::proof_parser::circom_prover::{convert_proof, convert_public_inputs};
use groth16_solana::groth16::Groth16Verifier;

// 1. Generate proof with circom-prover
let proof = CircomProver::prove(
    ProofLib::Arkworks,              // Use arkworks for proper serialization
    WitnessFn::RustWitness(witness), // Transpiled WASM witness
    circuit_inputs,
    zkey_path,
)?;

// 2. Convert to groth16-solana format (handles negation internally)
let (proof_a, proof_b, proof_c) = convert_proof(&proof.proof)?;
let public_inputs: [[u8; 32]; N] = convert_public_inputs(&proof.pub_inputs);

// 3. Verify on-chain
let mut verifier = Groth16Verifier::new(
    &proof_a,
    &proof_b,
    &proof_c,
    &public_inputs,
    &VERIFYING_KEY,
)?;
verifier.verify()?;
```

### With snarkjs (Manual Conversion Required)

```javascript
// Generate with snarkjs
const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    input, 
    wasmPath, 
    zkeyPath
);

// proof.pi_a, pi_b, pi_c are in snarkjs format:
// - BigInt arrays (not bytes)
// - G2 points in (c0, c1) order
// - Proof A NOT negated

// Must convert:
// 1. BigInt to BE bytes
// 2. Reorder G2 to (c1, c0)
// 3. NEGATE proof A's y-coordinate
```

## 3. Our Current Implementation Analysis

### What We Have

**Verification Key Generator** (`scripts/generate_vk.js`):
- ✅ Converts snarkjs VK to Rust constants
- ✅ Handles G2 alt ordering correctly
- ✅ Outputs BE bytes
- ✅ Matches reference format

**Proof Generator** (`scripts/generate_proof_vectors.js`):
- ✅ Converts snarkjs proof to bytes
- ✅ Handles G2 alt ordering
- ❌ Does NOT negate proof A (kept raw snarkjs)
- ❌ Manual byte manipulation (no arkworks)

**On-Chain Conversion** (`src/zk_verifier.rs`):
- ✅ Attempts proof A negation
- ❌ Manual LE arithmetic (complex, error-prone)
- ❌ Not using arkworks serialization
- ❌ Tests fail with both negated and non-negated proofs

### Root Cause Analysis

**Why Tests Are Failing:**

1. **Arithmetic Precision Issue**
   - Manual modular arithmetic may have subtle bugs
   - Field element negation requires exact precision
   - BN254 prime is 254 bits - easy to make mistakes

2. **Endianness Confusion**
   - Proof A negation requires: BE → LE → negate → LE → BE
   - OR: negate directly in BE (complex)
   - Our implementation swaps only y-coordinate, may miss edge cases

3. **Missing Arkworks Serialization**
   - Reference uses arkworks `.neg()` and `.serialize_with_mode()`
   - Arkworks handles all curve arithmetic correctly
   - We're trying to replicate this manually (risky)

4. **Both Proofs Fail**
   - CRITICAL: Both raw AND negated proofs fail verification
   - This suggests the issue isn't just negation
   - Possible causes:
     - VK mismatch with proof
     - Public inputs format issue
     - Proof B/C format issue
     - Fundamental incompatibility

## 4. Diagnosis Steps

### Step 1: Verify VK is Correct

```bash
# Compare our VK with circuit VK
node -e "
const vk = require('./circuits/age_proof/build/verification_key.json');
console.log('vk_alpha_g1 x:', BigInt(vk.vk_alpha_1[0]).toString(16));
"
# Should match first 32 bytes of AGE_PROOF_VK.vk_alpha_g1
```

### Step 2: Verify Public Inputs

```bash
# Compare our public inputs with circuit
node -e "
const pub = require('./circuits/age_proof/build/public.json');
console.log('Input 0:', BigInt(pub[0]).toString(16));
"
# Should match AGE_PUBLIC_INPUTS[0]
```

### Step 3: Verify Proof is Valid

```bash
cd circuits/age_proof
npx snarkjs groth16 verify \
    build/verification_key.json \
    build/public.json \
    build/proof.json
# Should output: [INFO]  snarkJS: OK!
```

### Step 4: Test with Reference PROOF Constant

The reference repo has a working `PROOF` constant. If we can test with that:
```rust
// Use their PROOF and VK to verify our verifier setup works
let proof_a = REFERENCE_PROOF[0..64].try_into().unwrap();
// ... (already negated in their constant)
```

## 5. Solutions

### Option 1: Use circom-prover (Recommended)

**Advantages:**
- Proven to work with groth16-solana
- Handles all conversions correctly
- Uses arkworks internally
- Well-tested

**Requirements:**
- Transpile WASM witness to Rust
- Use rust-witness crate
- Generate proofs in Rust tests

**Implementation:**
```rust
// In tests/proof_generator.rs
rust_witness::witness!(age_proof);

let proof = CircomProver::prove(
    ProofLib::Arkworks,
    WitnessFn::RustWitness(age_proof_witness),
    input_json,
    zkey_path,
)?;
```

### Option 2: Fix Manual Conversion

**Advantages:**
- Keep JavaScript proof generation
- No witness transpilation needed

**Challenges:**
- Must replicate arkworks negation exactly
- Complex LE/BE conversions
- Hard to debug

**Fix Approach:**
```rust
// Use proper field arithmetic library
use ark_bn254::Fr;
use ark_ff::PrimeField;

fn negate_proof_a_coordinate(y_bytes: &[u8; 32]) -> [u8; 32] {
    // Convert BE to field element
    let y = Fr::from_be_bytes_mod_order(y_bytes);
    // Negate
    let neg_y = -y;
    // Convert back to BE
    let mut result = [0u8; 32];
    result.copy_from_slice(&neg_y.into_bigint().to_bytes_be()[..32]);
    result
}
```

### Option 3: Test Minimal Example

Create a minimal test with known-good data:
```rust
#[test]
fn test_with_reference_proof() {
    // Use PROOF constant from groth16-solana tests
    // Use their VK and public inputs
    // Verify our Groth16Verifier::new() and verify() work
}
```

## 6. Next Steps

1. ✅ **Verify VK format** (confirmed correct)
2. ✅ **Verify public inputs** (confirmed correct)
3. ✅ **Verify proof is valid with snarkjs** (confirmed OK)
4. ❌ **Identify why both negated/non-negated fail**
   - This is the key issue
   - Suggests problem isn't just negation
5. **Create minimal reproducible test**
   - Use reference PROOF constant
   - Isolate whether issue is our proof or our code
6. **Choose solution path**
   - circom-prover (more reliable)
   - OR fix manual conversion (more work)

## 7. Common Pitfalls

1. **Endianness Errors**: Mixing BE/LE in arithmetic
2. **G2 Ordering**: Using (c0,c1) instead of (c1,c0)
3. **Field Size**: Public inputs >= field size
4. **Negation**: Forgetting to negate proof A
5. **VK Typo**: `vk_gamme_g2` (not `vk_gamma_g2`) in groth16-solana
6. **Proof Format**: Compressed vs uncompressed confusion

## 8. Resources

- [groth16-solana GitHub](https://github.com/Lightprotocol/groth16-solana)
- [Light Protocol Audit](https://file.notion.so/...pdf)
- [Groth16 Paper](https://eprint.iacr.org/2016/260.pdf)
- [BN254 Curve Spec](https://neuromancer.sk/std/bn/bn254)
- [Solana BN254 Docs](https://docs.solana.com/developing/runtime-facilities/sysvar#bn254-precompiles)
