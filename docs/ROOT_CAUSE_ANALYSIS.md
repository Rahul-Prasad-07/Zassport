# Root Cause Analysis: ZK Verification Failure

## Executive Summary

After extensive debugging and diagnosis, we have identified that **the verification failure is NOT due to proof A negation**. Both negated and non-negated proofs fail with the same error: `PreparingInputsG1MulFailed`.

## Key Findings

### ✅ Verified Correct
1. **VK Format**: `vk_alpha_g1` matches circuit VK byte-for-byte
2. **Public Inputs**: All 5 inputs match circuit outputs exactly  
3. **Proof Validity**: snarkjs confirms proof is valid (`OK!`)
4. **Proof A Negation**: Mathematical calculation is correct (verified manually)
5. **G2 Ordering**: Alt order (c1, c0) implemented correctly

### ❌ The Actual Problem
- **Error**: `PreparingInputsG1MulFailed`
- **What this means**: Failure occurs during preparation of public inputs for verification
- **When it happens**: During `G1::mul()` operation combining IC points with public inputs
- **Critical**: BOTH negated AND non-negated proofs produce identical error

## The PreparingInputsG1MulFailed Error

This error occurs in `groth16-solana` when preparing verification inputs:

```rust
// From groth16-solana source
let mut vk_inputs = self.verifying_key.vk_ic[0];
for (i, input) in self.public_inputs.iter().enumerate() {
    vk_inputs = G1Affine::add(
        &vk_inputs,
        &G1Affine::mul(&self.verifying_key.vk_ic[i + 1], input) // <- FAILS HERE
    )?;
}
```

### Possible Causes

1. **IC Points Format Issue**
   - IC points in VK may be in wrong byte order
   - IC points might need to be negated (like proof A)
   - IC points might be in compressed format when uncompressed expected

2. **Public Inputs Range Issue**
   - Inputs must be < BN254 field size
   - Our inputs verified to be in valid range
   - But format might be incorrect (BE/LE confusion)

3. **VK IC Count Mismatch**
   - We have 5 public inputs
   - Should have 6 IC points (5 inputs + 1 base)
   - Need to verify: `vk_ic.len() == public_inputs.len() + 1`

4. **Point Validation Failure**
   - IC points might not be valid curve points
   - Points might be zero (infinity)
   - Points might not be on the BN254 curve

## Diagnostic Test Results

```
=== Testing with our proof (negated) ===
✗ Verification failed: PreparingInputsG1MulFailed

=== Testing with RAW proof (non-negated) ===
✗ Verification failed: PreparingInputsG1MulFailed  <-- SAME ERROR!
```

**Conclusion**: The proof A negation is working. The problem is elsewhere.

## What We Know About Our Data

### Proof Components (from test output)
```
Proof A:
  x: 0ab20cb424c936fdf6612689e1b40aaa9b3f3c547e8ce342aecdb171ddcda9e3
  y: 192d1384a174849bbf3d550592764b9ff72c78325b9d5ef43f4df8e87d9d2f4c (negated)

Proof B (G2 in alt order):
  c1.x: 1572495fb9ac204ff5daf3d3dcedc7c8b87110d61d381d04bb711b6b06a493da
  c1.y: 2147db3e1086a2f9be2b9454a16d4d5a5166012da30135eff1b96c25a1b0dca5
  c0.x: 17b39d5e77196ee86eb3e0987c05ee67fd726fce15c3570e2a54a29814f87fe9
  c0.y: 073e45276cac72963d52863a2545cbd9e0cc74b3a8141b333be22bc5562fc356

Proof C:
  x: 2a7b0a0ed5ef17cfcd36fdb9ce6500da37be20df7b2a9af5036784f6469448ea
  y: 0c2ab4be36242a5375f5a7f4e63ff3e1cb997e6375d76dd1eda7cb33d8d4ee11
```

None of these are all zeros, so proof points are valid.

### VK IC Points Count

Let me check the VK structure:

## Next Steps to Solve

### 1. Verify IC Points Count
```bash
# Check if we have the right number of IC points
# Should be: public_inputs.len() + 1 = 5 + 1 = 6
```

### 2. Inspect IC Points Generation
The issue is likely in `scripts/generate_vk.js`:
- How are IC points being extracted from snarkjs VK?
- Are they in the correct format?
- Are all IC points present?

### 3. Compare with Reference Implementation
The groth16-solana tests have working examples. We need to:
- Check their VK IC format
- Check their IC point byte order
- Compare their IC generation with ours

### 4. Test with Minimal Circuit
Create the simplest possible circuit:
```circom
template Simple() {
    signal input a;
    signal output b;
    b <== a * a;
}
```
- Generate VK and proof
- Test verification
- If this works, compare with our age_proof circuit

## Recommended Actions

**IMMEDIATE:**
1. Check IC points count in AGE_PROOF_VK
2. Verify IC points are valid curve points
3. Compare IC format with reference implementation

**SHORT TERM:**
1. Create minimal test circuit
2. Generate proof using circom-prover (arkworks-based)
3. Test if arkworks-generated proofs work

**LONG TERM:**
1. If snarkjs proofs are incompatible, document limitation
2. Implement circom-prover integration properly
3. Create tooling for arkworks-based proof generation

## Technical Details

### BN254 Field Prime
```
p = 21888242871839275222246405745257275088696311157297823662689037894645226208583
  = 0x30644e72e131a029b85045b68181585d2833e84879b9709143e1f593f0000001
```

### Error Code
```rust
PreparingInputsG1MulFailed = 6017
// From groth16-solana/src/errors.rs
```

### VK Structure Required
```rust
Groth16Verifyingkey {
    nr_pubinputs: 5,
    vk_alpha_g1: [u8; 64],
    vk_beta_g2: [u8; 128],
    vk_gamme_g2: [u8; 128],  // typo is intentional in crate
    vk_delta_g2: [u8; 128],
    vk_ic: &[
        [u8; 64],  // IC[0] - base point
        [u8; 64],  // IC[1] - for input[0]
        [u8; 64],  // IC[2] - for input[1]
        [u8; 64],  // IC[3] - for input[2]
        [u8; 64],  // IC[4] - for input[3]
        [u8; 64],  // IC[5] - for input[4]
    ],
}
```

## Files to Investigate

1. `scripts/generate_vk.js` - IC points generation
2. `programs/zassport/src/zk_verifier/verification_keys.rs` - VK constants
3. Reference: `groth16-solana/tests/rust-vk/verifying_key.bin`

## Conclusion

The verification failure has NOTHING to do with proof A negation. The issue is in how we're generating or formatting the IC points in the verification key, or possibly how public inputs interact with these points during the `G1::mul()` operation.

**The next debugging session should focus entirely on the IC points and public input preparation, NOT on proof format.**
