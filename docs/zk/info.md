Great question! Let me explain the ZK circuit workflow and what needs to be pushed vs what the frontend uses: 

Read [](file:///Users/kyto/zk/Zassport/circuits)

Read [](file:///Users/kyto/zk/Zassport/circuits/age_proof/circuit.circom#1-1), lines 1 to 30

Read [](file:///Users/kyto/zk/Zassport/circuits/age_proof)

Read [](file:///Users/kyto/zk/Zassport/apps/web/public/circuits)

Read [](file:///Users/kyto/zk/Zassport/apps/web/public/circuits/age_proof)

Read [](file:///Users/kyto/zk/Zassport/apps/web/src/lib/zkProofsReal.ts#1-1), lines 1 to 50

Read [](file:///Users/kyto/zk/Zassport/apps/web/src/lib/zkProofsReal.ts#100-100), lines 100 to 150

Perfect! Now let me create a comprehensive explanation:

## 🔐 **ZK Circuits: How It Works & What to Push**

### **📊 The Complete ZK Flow:**

```
┌─────────────────────────────────────────────────────────────────┐
│                    ZK PROOF GENERATION FLOW                     │
└─────────────────────────────────────────────────────────────────┘

1. CIRCUIT DEVELOPMENT (circuits/)
   ├─ Write .circom files (source code)
   ├─ Compile to .r1cs (constraint system)
   └─ Generate proving/verifying keys

2. TRUSTED SETUP (one-time ceremony)
   ├─ Powers of Tau (ptau files)
   ├─ Circuit-specific setup
   └─ Generate .zkey files

3. FRONTEND DEPLOYMENT (apps/web/public/circuits/)
   ├─ Copy compiled artifacts
   ├─ User generates proofs in browser
   └─ Verifier validates proofs

4. VERIFICATION (verifier-service/)
   ├─ Off-chain proof validation
   └─ On-chain attestation signing
```

---

### **🗂️ Circuit Files Explained:**

| File Type | Purpose | Size | Push to Git? | Frontend Uses? |
|-----------|---------|------|--------------|----------------|
| **`.circom`** | Circuit source code | Small (~5KB) | ✅ YES | ❌ No |
| **`.r1cs`** | Compiled constraints | Medium (~100KB) | ❌ NO | ❌ No |
| **`.wasm`** | Witness generator | Medium (~500KB) | ✅ YES | ✅ **YES** |
| **`.zkey`** | Proving key | Large (5-50MB) | ⚠️ **FINAL ONLY** | ✅ **YES** |
| **`verification_key.json`** | Public verifying key | Small (~2KB) | ✅ YES | ✅ **YES** |
| **`.ptau`** | Powers of Tau | Huge (12-37MB) | ⚠️ **FINAL ONLY** | ❌ No |
| **`witness.wtns`** | Generated witness | Small | ❌ NO | ❌ No |
| **`proof.json`** | Generated proof | Small | ❌ NO | ❌ No |

---

### **🎯 What Your Frontend Uses:**

Your frontend (web) needs **3 files per circuit** to generate proofs in the browser:

```javascript
// Example: Age Proof Circuit
/public/circuits/age_proof/
├── circuit.wasm                    // ← Generates witness from inputs
├── circuit_final.zkey              // ← Proves the circuit (proving key)
└── verification_key.json           // ← Verifies the proof
```

**How it works in browser:**

```typescript
// 1. User scans passport → extracts data
const passportData = { dateOfBirth: "1998-05-15", ... };

// 2. Frontend generates proof using .wasm + .zkey
const { proof, publicSignals } = await snarkjs.groth16.fullProve(
  inputs,                                    // Private: DOB, salt
  '/circuits/age_proof/circuit.wasm',       // Witness generator
  '/circuits/age_proof/circuit_final.zkey'  // Proving key
);

// 3. Frontend verifies locally (optional)
const verified = await snarkjs.groth16.verify(
  verificationKey,                          // Public key
  publicSignals,                            // Public inputs
  proof                                     // The proof
);

// 4. Send to verifier-service for attestation
const response = await fetch('https://verifier.zassport.com/verify-age', {
  method: 'POST',
  body: JSON.stringify({ proof, publicSignals })
});
```

---

### **📦 What to Push to GitHub:**

#### **✅ DO PUSH:**

```bash
circuits/
├── age_proof/
│   ├── circuit.circom                # Source code ✅
│   └── verification_key.json         # Verifier key ✅
├── nationality_proof/
│   ├── circuit.circom                # Source code ✅
│   └── verification_key.json         # Verifier key ✅
├── scripts/                          # Build scripts ✅
└── pot15_final.ptau                  # Final Powers of Tau ✅

apps/web/public/circuits/
├── age_proof/
│   ├── circuit.wasm                  # Witness generator ✅
│   ├── circuit_final.zkey            # Final proving key ✅
│   └── verification_key.json         # Verifier key ✅
└── nationality_proof/
    ├── circuit.wasm                  # Witness generator ✅
    ├── circuit_final.zkey            # Final proving key ✅
    └── verification_key.json         # Verifier key ✅
```

#### **❌ DON'T PUSH:**

```bash
circuits/
├── */build/                          # Build artifacts ❌
├── */*.r1cs                          # Intermediate files ❌
├── */circuit_0000.zkey               # Intermediate keys ❌
├── */circuit_0001.zkey               # Intermediate keys ❌
├── */witness.wtns                    # Generated witness ❌
├── */proof.json                      # Test proofs ❌
├── pot15_0000.ptau                   # Intermediate ceremony ❌
└── pot15_0001.ptau                   # Intermediate ceremony ❌
```

---

### **🔐 How ZK Proves Age Without Revealing DOB:**

**Scenario:** Prove you're 18+ without revealing exact birthdate

**Traditional way (BAD):**
```
❌ User: "I was born on 1998-05-15"
❌ Verifier: Calculates age = 26 years old
Problem: Verifier knows exact birthday!
```

**ZK way (GOOD):**
```
✅ User: "Here's a cryptographic proof"
✅ Verifier: Proof is valid = age is 18+
Result: Verifier only learns: AGE >= 18 (nothing else!)
```

**Technical breakdown:**

```typescript
// PRIVATE INPUTS (only user knows)
dateOfBirth: "1998-05-15"  // Secret!
salt: 123456789             // Random nonce

// PUBLIC INPUTS (everyone knows)
commitment: Hash(DOB, salt)     // Unique identifier
currentTimestamp: 1733270400    // Today's date
minAge: 18                      // Requirement

// CIRCUIT PROVES (without revealing DOB):
// 1. currentTimestamp - dateOfBirth >= 18 years
// 2. commitment = Hash(dateOfBirth, salt)
// 3. User knows the preimage of commitment

// OUTPUT: proof + publicSignals
// Verifier ONLY learns: "This person is 18+"
// Verifier CANNOT learn: Exact DOB, age, or any other detail
```

---

### **🏗️ Your Current Setup:**

**Circuits in development:**
- ✅ `age_proof/` - Proves age range (18+, 21+, etc.)
- ✅ `nationality_proof/` - Proves nationality
- ✅ `passport_verifier/` - Validates passport authenticity
- ✅ `expiry/` - Proves document not expired
- ✅ `sanctions/` - Proves not on sanctions list
- ✅ `age_range/` - Proves age in specific range

**Frontend receives** (from circuits):
1. `.wasm` - Generates witness from private inputs
2. `.zkey` - Generates proof (ZK magic happens here!)
3. `verification_key.json` - Verifies proof is valid

**Verifier service uses:**
- Same `verification_key.json`
- Validates proof off-chain
- Signs attestation with ED25519 key
- Sends to Solana program for on-chain storage

---

### **📝 Git Strategy Summary:**

```bash
# ✅ Commit these (users need them)
apps/web/public/circuits/*/*.wasm
apps/web/public/circuits/*/*.zkey
apps/web/public/circuits/*/verification_key.json

# ✅ Commit these (developers need them)
circuits/*/*.circom
circuits/pot15_final.ptau

# ❌ Ignore these (.gitignore handles it)
circuits/*/build/
circuits/*/*.r1cs
circuits/pot*_0000.ptau
circuits/pot*_0001.ptau
node_modules/
```

---

**Key Takeaway:** Your frontend needs the **compiled artifacts** (`.wasm`, `.zkey`, `verification_key.json`) to generate proofs client-side, but NOT the source `.circom` files. The source files are only needed during development/compilation phase.