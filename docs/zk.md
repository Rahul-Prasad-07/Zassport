# 🚀 **Complete Guide: Building ZK Passport System with Anchor**

## **📋 Overview: ZK Passport System Architecture**

A ZK Passport system allows users to prove facts about their identity (age, nationality, passport validity) **without revealing any personal data**. Here's the complete flow:

### **1. Circuit Design (Circom)**
- **What**: Mathematical circuits defining ZK logic
- **Tools**: Circom compiler, snarkjs
- **Output**: `.r1cs` constraint file, `.wasm` for proof generation

### **2. Trusted Setup (Ceremony)**
- **What**: Generate proving/verification keys
- **Tools**: snarkjs powers-of-tau
- **Output**: `.zkey` files, `verification_key.json`

### **3. Proof Generation (Client-Side)**
- **What**: Create ZK proofs from user data
- **Tools**: snarkjs, circomlibjs
- **Output**: Proof + public signals

### **4. On-Chain Verification (Anchor Program)**
- **What**: Verify proofs cryptographically
- **Tools**: groth16-solana crate
- **Output**: Boolean verification result

### **5. Identity Management**
- **What**: Store commitments, manage reputation
- **Tools**: Anchor PDAs, events
- **Output**: On-chain identity records

---

## **🔧 Step-by-Step: Building the Smart Program**

### **1. Setup Anchor Project**
```bash
# Initialize new Anchor project
anchor init zassport
cd zassport

# Add dependencies
cargo add groth16-solana anchor-lang anchor-spl
```

### **2. Define Program Structure**
```
programs/zassport/
├── Cargo.toml          # Dependencies
├── src/
│   ├── lib.rs          # Main program entry
│   ├── errors.rs       # Error definitions
│   ├── zk_verifier.rs  # ZK verification logic
│   ├── instructions/   # Individual instructions
│   └── state/          # Account structs
```

### **3. Core Program Logic (`lib.rs`)**
```rust
use anchor_lang::prelude::*;
use crate::zk_verifier::*;
use crate::instructions::*;

declare_id!("5sCDzoF1pzHisqrrpmfbDynCdjgBJX9FcmVBvJzBio2V");

#[program]
pub mod zassport {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        // Initialize nullifier registry
        Ok(())
    }

    pub fn register_identity(
        ctx: Context<RegisterIdentity>,
        commitment: [u8; 32],
        nullifier: [u8; 32],
    ) -> Result<()> {
        // Store identity commitment
        Ok(())
    }

    pub fn verify_age_proof(
        ctx: Context<VerifyAgeProof>,
        proof: Vec<u8>,
        current_timestamp: u64,
        min_age: u64,
        max_age: u64,
    ) -> Result<()> {
        // Verify ZK proof
        zk_verifier::verify_age_proof(
            &proof,
            &ctx.accounts.identity.commitment,
            &ctx.accounts.identity.nullifier,
            current_timestamp,
            min_age,
            max_age,
        )?;
        Ok(())
    }

    // Similar for nationality and passport proofs
}
```

---

## **🔐 Implementing ZK in Anchor Program**

### **1. Understanding Groth16 Integration**

Groth16 is a zero-knowledge proof system that allows proving statements about secret data without revealing the data itself. In Anchor:

- **Client generates proof** using circuit + private inputs
- **Program verifies proof** using verification key + public inputs

### **2. ZK Verifier Module (`zk_verifier.rs`)**

```rust
use groth16_solana::{Groth16Verifier, decompress_proof};
use crate::errors::ZKPassportError;

// Load verification keys from circuit builds
pub mod verification_keys {
    // Age proof VK (extracted from circuits/age_proof/verification_key.json)
    pub const AGE_VK: [u8; 128] = [
        // VK bytes here...
    ];
    
    pub const NATIONALITY_VK: [u8; 128] = [
        // VK bytes here...
    ];
    
    pub const PASSPORT_VK: [u8; 128] = [
        // VK bytes here...
    ];
}

pub fn verify_age_proof(
    proof_bytes: &[u8],
    commitment: &[u8; 32],
    nullifier: &[u8; 32],
    current_timestamp: u64,
    min_age: u64,
    max_age: u64,
) -> Result<()> {
    // Decompress proof if needed
    let proof = if proof_bytes.len() == 256 {
        decompress_proof(proof_bytes)?
    } else {
        // Assume compressed format
        proof_bytes.try_into().map_err(|_| ZKPassportError::InvalidProof)?
    };

    // Public inputs in correct order
    let public_inputs = [
        commitment.as_slice(),
        nullifier.as_slice(),
        &current_timestamp.to_le_bytes(),
        &min_age.to_le_bytes(),
        &max_age.to_le_bytes(),
    ].concat();

    // Verify using Groth16
    Groth16Verifier::verify(
        &proof,
        &verification_keys::AGE_VK,
        &public_inputs,
    ).map_err(|_| ZKPassportError::ProofVerificationFailed)?;

    Ok(())
}
```

### **3. Circuit-to-Program Integration**

**Circuit Definition (Circom):**
```circom
template AgeProof() {
    signal input dateOfBirth;     // Private
    signal input salt;           // Private
    signal input currentTimestamp; // Public
    signal input minAge;         // Public
    signal input maxAge;         // Public
    
    // Generate commitment
    signal commitment = Poseidon(2)([dateOfBirth, salt]);
    
    // Verify age range
    signal age = (currentTimestamp - dateOfBirth) / 31536000; // Years
    age >= minAge;
    age <= maxAge;
    
    // Output commitment for on-chain storage
    signal output commitmentOut;
    commitmentOut <== commitment;
}
```

**Trusted Setup:**
```bash
# Generate powers of tau
snarkjs powersoftau new bn128 12 pot12_0000.ptau -v

# Setup circuit
snarkjs powersoftau prepare phase2 pot12_0000.ptau pot12_final.ptau -v
snarkjs groth16 setup circuit.r1cs pot12_final.ptau circuit_0000.zkey

# Contribute to ceremony (multiple rounds for security)
snarkjs zkey contribute circuit_0000.zkey circuit_0001.zkey --name="1st Contributor"

# Export verification key
snarkjs zkey export verificationkey circuit_0001.zkey verification_key.json
```

**Proof Generation (Client):**
```typescript
import * as snarkjs from "snarkjs";

const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    {
        dateOfBirth: 19900101,
        salt: 12345,
        currentTimestamp: Date.now(),
        minAge: 18,
        maxAge: 65,
    },
    "circuit.wasm",
    "circuit_final.zkey"
);

// Compress proof for on-chain
const compressedProof = await snarkjs.groth16.exportSolidityCallData(proof, publicSignals);
```

---

## **🔍 Debugging the Failing Tests**

### **Issue Analysis:**

The tests are failing because:
1. **ProofVerificationFailed**: Proofs don't verify against the VK
2. **G1CompressionFailed**: Proof format issues
3. **Error code mismatch**: 6015 instead of 6010

### **Root Causes:**

1. **Proof Format**: Client generates uncompressed proofs, but verifier expects compressed
2. **Public Input Ordering**: Mismatch between circuit and verifier
3. **VK Loading**: Incorrect VK byte extraction
4. **Field Encoding**: Big-endian vs little-endian issues

### **Fix Steps:**

**1. Fix Proof Compression:**
```rust
// In zk_verifier.rs
pub fn verify_age_proof(...) -> Result<()> {
    let proof = if proof_bytes.len() == 256 {
        // Uncompressed: convert to compressed format
        let uncompressed: [u8; 256] = proof_bytes.try_into()?;
        compress_proof(&uncompressed)?
    } else {
        // Already compressed
        proof_bytes.try_into()?
    };
    
    // Continue with verification...
}
```

**2. Verify Public Input Order:**
```rust
// Ensure order matches circuit outputs
let public_inputs = vec![
    commitment.to_vec(),
    nullifier.to_vec(),
    current_timestamp.to_le_bytes().to_vec(),
    min_age.to_le_bytes().to_vec(),
    max_age.to_le_bytes().to_vec(),
].concat();
```

**3. Check VK Extraction:**
```bash
# Regenerate VK constants
node -e "
const vk = require('./circuits/age_proof/verification_key.json');
console.log('pub const AGE_VK: [u8; 128] = [');
const bytes = Buffer.from(JSON.stringify(vk));
for(let i = 0; i < 128; i++) {
    process.stdout.write(bytes[i] + ', ');
    if((i+1) % 16 === 0) console.log('');
}
console.log('];');
" > vk_age.rs
```

**4. Test with Known Good Proof:**
```rust
#[test]
fn test_age_proof_with_fixture() {
    // Use proof from snarkjs test output
    let proof = include_bytes!("fixtures/age_proof.bin");
    let public_inputs = include_bytes!("fixtures/age_public.bin");
    
    assert!(verify_age_proof(proof, &commitment, &nullifier, timestamp, 18, 65).is_ok());
}
```

### **Complete Fix Sequence:**

1. **Regenerate VK constants** with correct byte extraction
2. **Fix proof compression** in verifier
3. **Verify public input ordering** matches circuit
4. **Add fixture tests** with known good proofs
5. **Run tests** and iterate on failures

---

## **🚀 Next Steps**

1. **Run the fixes above** and test with `cargo test -p zassport`
2. **Generate fixture proofs** using snarkjs test command
3. **Verify VK extraction** matches circuit outputs
4. **Test end-to-end** with client proof generation

This will give you a fully functional ZK passport system where users can prove identity attributes without revealing personal data! 

**Ready to implement these fixes? Let's start with regenerating the VK constants.** 🚀