## 🎓 **Complete ZK (Zero-Knowledge) Deep Dive: From Theory to Implementation**

Let me explain everything from scratch, including all the mathematical concepts, cryptographic theory, and practical implementation.

---

## **Part 1: What is Zero-Knowledge?**

### **The Restaurant Analogy:**

Imagine you need to prove you're over 21 to buy alcohol:

**Traditional way (BAD):**
```
You: "Here's my ID showing I was born on May 15, 1998"
Bartender: Looks at ID, sees your birthdate, name, address, photo
Result: Bartender knows EVERYTHING about you
```

**Zero-Knowledge way (GOOD):**
```
You: "I can prove I'm over 21 without showing my ID"
Bartender: "Okay, prove it"
You: [Mathematical magic happens]
Bartender: "The proof is valid. You're over 21"
Result: Bartender ONLY knows you're 21+, nothing else
```

**Zero-Knowledge means:** Proving something is true WITHOUT revealing WHY it's true.

---

## **Part 2: ZK Mathematical Foundation**

### **Core Concept: Constraint Systems**

ZK proofs work by converting logical statements into mathematical equations called **constraints**.

**Example - Proving Age:**

```
Statement: "My age is >= 18"

Traditional code:
if (currentYear - birthYear >= 18) { return true; }

ZK constraint:
currentTimestamp - dateOfBirth >= 18 * 31536000 = 1
                                                   ↑
                                      This MUST equal 1 (true)
```

### **R1CS (Rank-1 Constraint System):**

Every computation gets converted to equations of the form:
```
(A · witness) × (B · witness) = (C · witness)

Where:
- A, B, C = coefficient matrices
- witness = your secret values (like date of birth)
- · = dot product
- × = multiplication
```

**Real example from age proof:**

```circom
// This Circom code:
signal age;
signal isAdult;
age = currentTime - birthDate;
isAdult = age >= 18;

// Gets compiled into constraints like:
constraint[0]: age * 1 = currentTime - birthDate
constraint[1]: (age - 18) * factor = isAdult
constraint[2]: isAdult * isAdult = isAdult  // Boolean check
```

---

## **Part 3: The Three Pillars of ZK-SNARKs**

Your system uses **Groth16**, a specific type of ZK-SNARK.

### **What is SNARK?**

**SNARK = Succinct Non-interactive ARgument of Knowledge**

- **Succinct**: Proof is tiny (~200 bytes) even for complex computations
- **Non-interactive**: No back-and-forth, just: prove → verify
- **Argument**: Computationally sound (can't fake unless you break crypto)
- **of Knowledge**: Prover actually knows the secret, not just guessing

### **Groth16 Components:**

1. **Proving Key (`.zkey` file)**: 
   - Mathematical parameters for generating proofs
   - Contains elliptic curve points (G1, G2 groups)
   - Size: 5-50 MB (large!)
   
2. **Verification Key (`verification_key.json`)**:
   - Public parameters for checking proofs
   - Much smaller than proving key
   - Size: ~2 KB

3. **Common Reference String (CRS)**:
   - Generated during "Trusted Setup"
   - Must be created honestly (toxic waste problem)
   - Powers of Tau ceremony addresses this

---

## **Part 4: Circom - The Circuit Language**

### **What is Circom?**

Circom is a Domain-Specific Language (DSL) for writing ZK circuits. Think of it as "ZK programming language".

**Your Age Proof Circuit Explained Line-by-Line:**

```circom
pragma circom 2.1.6;  // Version declaration

// Import cryptographic primitives
include "circomlib/circuits/poseidon.circom";  // Hash function
include "circomlib/circuits/comparators.circom"; // Greater than, less than

template AgeProof() {
    // ═══════════════════════════════════════════════════
    // PUBLIC INPUTS (everyone can see these)
    // ═══════════════════════════════════════════════════
    signal input commitment;        // Hash(dateOfBirth, salt)
    signal input nullifier;         // Hash(commitment) - prevents double-use
    signal input currentTimestamp;  // Today's date (Unix timestamp)
    signal input minAge;           // Minimum age requirement (e.g., 18)
    signal input maxAge;           // Maximum age allowed (e.g., 120)

    // ═══════════════════════════════════════════════════
    // PRIVATE INPUTS (only prover knows these)
    // ═══════════════════════════════════════════════════
    signal input dateOfBirth;      // Your actual birthdate (SECRET!)
    signal input salt;             // Random number (SECRET!)

    // ═══════════════════════════════════════════════════
    // CONSTRAINTS (mathematical proof logic)
    // ═══════════════════════════════════════════════════
    
    // 1. Verify commitment is correct
    //    commitment MUST equal Hash(dateOfBirth, salt)
    component hasher = Poseidon(2);
    hasher.inputs[0] <== dateOfBirth;
    hasher.inputs[1] <== salt;
    hasher.out === commitment;  // Triple === means CONSTRAINT
    
    // 2. Check age bounds
    //    Age = (currentTimestamp - dateOfBirth) / seconds_per_year
    signal age <== (currentTimestamp - dateOfBirth) / 31536000;
    
    // 3. Verify age >= minAge
    component ageCheck = GreaterEqThan(32);
    ageCheck.in[0] <== age;
    ageCheck.in[1] <== minAge;
    ageCheck.out === 1;  // Must be true
    
    // 4. Verify age <= maxAge
    component maxCheck = LessEqThan(32);
    maxCheck.in[0] <== age;
    maxCheck.in[1] <== maxAge;
    maxCheck.out === 1;  // Must be true
}

component main {public [commitment, nullifier, currentTimestamp, minAge, maxAge]} = AgeProof();
```

**Key Concepts:**

- **Signals**: Like variables but immutable once set
- **Components**: Reusable circuit modules (like functions)
- **Constraints (`===`)**: Mathematical equations that MUST be satisfied
- **`<==`**: Assignment WITH constraint check
- **`<--`**: Assignment WITHOUT constraint (dangerous!)

---

## **Part 5: The Trusted Setup Ceremony**

### **Why Do We Need It?**

Groth16 requires a "Common Reference String" (CRS) generated through a multi-party ceremony.

**The Problem (Toxic Waste):**

```
During setup, secret random values (α, β, γ, δ) are generated.
If anyone keeps these secrets, they can create FAKE proofs!

Example:
- Alice generates setup: knows secret = 12345
- Alice can now create fake proofs: "I'm 18+" even if she's 12
- The secret is called "toxic waste"
```

**The Solution (Powers of Tau):**

Multiple participants contribute randomness. As long as ONE participant destroys their secret, the system is secure.

```
Round 1: Alice contributes → τ₁ = random₁
Round 2: Bob contributes   → τ₂ = τ₁ × random₂
Round 3: Carol contributes → τ₃ = τ₂ × random₃
...
Round N: Final τ = τ₁ × τ₂ × τ₃ × ... × τₙ

If ANY ONE person (Alice, Bob, or Carol) deletes their random value,
the final τ is secure!
```

**Your `.ptau` Files:**

```bash
pot15_final.ptau  # Powers of Tau for circuits with 2^15 constraints
                  # Result of multi-party ceremony
                  # Size: 37 MB
```

---

## **Part 6: Circuit Compilation Pipeline**

### **From `.circom` to Working Proof System:**

```
┌─────────────────────────────────────────────────────────────┐
│              CIRCUIT COMPILATION PIPELINE                   │
└─────────────────────────────────────────────────────────────┘

Step 1: Write Circuit (.circom)
├─ age_proof/circuit.circom
└─ Human-readable ZK logic

Step 2: Compile to R1CS
├─ Command: circom circuit.circom --r1cs
├─ Output: circuit.r1cs (100 KB)
└─ Binary constraint system

Step 3: Generate Witness Calculator
├─ Command: circom circuit.circom --wasm
├─ Output: circuit.wasm (500 KB)
└─ WebAssembly program that computes witness

Step 4: Generate Proving Key
├─ Command: snarkjs groth16 setup circuit.r1cs pot15_final.ptau circuit_0000.zkey
├─ Input: R1CS + Powers of Tau
├─ Output: circuit_0000.zkey (10 MB)
└─ Initial proving key

Step 5: Contribute to Key (Optional Security)
├─ Command: snarkjs zkey contribute circuit_0000.zkey circuit_0001.zkey
├─ Adds your randomness
└─ Output: circuit_0001.zkey (10 MB)

Step 6: Finalize Key
├─ Command: snarkjs zkey beacon circuit_0001.zkey circuit_final.zkey
├─ Uses random beacon (e.g., Bitcoin block hash)
└─ Output: circuit_final.zkey (10 MB) ← Frontend uses this!

Step 7: Export Verification Key
├─ Command: snarkjs zkey export verificationkey circuit_final.zkey verification_key.json
└─ Output: verification_key.json (2 KB) ← Frontend uses this!
```

---

## **Part 7: Complete Frontend ZK Flow**

Now let's trace exactly what happens in your app:

### **Step-by-Step User Journey:**

```typescript
// ═══════════════════════════════════════════════════════════
// STEP 1: User Scans Passport (Camera/NFC)
// ═══════════════════════════════════════════════════════════

// Location: apps/web/src/components/NFCReaderUI.tsx
const passportData = {
  fullName: "JOHN DOE",
  dateOfBirth: "1998-05-15",  // ← SECRET!
  nationality: "USA",
  documentNumber: "123456789",
  expirationDate: "2030-12-31",
  sex: "M"
};

// Data stored in browser memory (never sent to server!)
```

```typescript
// ═══════════════════════════════════════════════════════════
// STEP 2: Generate Commitment & Nullifier
// ═══════════════════════════════════════════════════════════

// Location: apps/web/src/lib/zkProofsReal.ts

import { buildPoseidon } from 'circomlibjs';

// A. Generate random salt (prevents rainbow table attacks)
const salt = BigInt(Math.floor(Math.random() * 1000000000));
// Example: salt = 847293610

// B. Convert date to Unix timestamp
const dobTimestamp = new Date("1998-05-15").getTime() / 1000;
// dobTimestamp = 895190400

// C. Generate commitment using Poseidon hash
const poseidon = await buildPoseidon();
const commitment = poseidon([BigInt(dobTimestamp), salt]);
// commitment = Hash(895190400, 847293610)
// Result: "12849372948572984759827498572984759827498"
//         ↑ This is PUBLIC (goes on blockchain)

// D. Generate nullifier (prevents double-spending)
const nullifier = poseidon([commitment]);
// nullifier = Hash(commitment)
// Result: "98374928374982374982374982374982374982"
//         ↑ This is PUBLIC (prevents reuse)
```

### **Why Poseidon Hash?**

Poseidon is a **ZK-friendly hash function**. Traditional hashes (SHA-256) require 20,000+ constraints. Poseidon only needs ~300 constraints!

```
Traditional: SHA-256(input) = output
             Requires 20,000 equations in ZK circuit
             
ZK-friendly: Poseidon(input) = output  
             Requires 300 equations in ZK circuit
             ↑ 67x more efficient!
```

---

```typescript
// ═══════════════════════════════════════════════════════════
// STEP 3: Prepare Proof Inputs
// ═══════════════════════════════════════════════════════════

const currentTimestamp = Math.floor(Date.now() / 1000);
// currentTimestamp = 1733270400 (Dec 4, 2025)

const proofInputs = {
  // ────────────────────────────────────────────────
  // PUBLIC INPUTS (visible in proof)
  // ────────────────────────────────────────────────
  commitment: "12849372948572984759827498572984759827498",
  nullifier: "98374928374982374982374982374982374982",
  currentTimestamp: "1733270400",
  minAge: "18",
  maxAge: "120",
  
  // ────────────────────────────────────────────────
  // PRIVATE INPUTS (stay on user's device!)
  // ────────────────────────────────────────────────
  dateOfBirth: "895190400",  // May 15, 1998
  salt: "847293610",         // Random nonce
};
```

---

```typescript
// ═══════════════════════════════════════════════════════════
// STEP 4: Generate Witness
// ═══════════════════════════════════════════════════════════

// The .wasm file calculates ALL intermediate signals

import * as snarkjs from 'snarkjs';

// Load witness calculator (circuit.wasm)
const witnessCalculator = await snarkjs.witnessCalculator(
  '/circuits/age_proof/circuit.wasm'
);

// Calculate witness (all circuit signals)
const witness = await witnessCalculator.calculateWitness(proofInputs);

// witness = [
//   1,                           // Always 1 (field element)
//   12849...498,                 // commitment (public)
//   9837...982,                  // nullifier (public)
//   1733270400,                  // currentTimestamp (public)
//   18,                          // minAge (public)
//   120,                         // maxAge (public)
//   895190400,                   // dateOfBirth (PRIVATE!)
//   847293610,                   // salt (PRIVATE!)
//   26,                          // age (computed internally)
//   1,                           // ageCheck result (computed)
//   1,                           // maxCheck result (computed)
//   ...                          // thousands of intermediate values
// ]

// Witness contains EVERYTHING, including secrets!
// This is why witness stays on client and is never sent!
```

---

```typescript
// ═══════════════════════════════════════════════════════════
// STEP 5: Generate ZK Proof (The Magic!)
// ═══════════════════════════════════════════════════════════

// Use proving key to generate proof
const { proof, publicSignals } = await snarkjs.groth16.prove(
  '/circuits/age_proof/circuit_final.zkey',  // Proving key (10 MB)
  witness                                      // All intermediate values
);

// ────────────────────────────────────────────────
// PROOF STRUCTURE (Groth16)
// ────────────────────────────────────────────────
proof = {
  pi_a: ["123...", "456...", "1"],     // Point on elliptic curve
  pi_b: [                               // Point on elliptic curve
    ["789...", "012..."],
    ["345...", "678..."],
    ["1", "0"]
  ],
  pi_c: ["901...", "234...", "1"],     // Point on elliptic curve
  protocol: "groth16",
  curve: "bn128"
};

// These are points on the BN128 elliptic curve!
// Total size: ~200 bytes

// ────────────────────────────────────────────────
// PUBLIC SIGNALS (visible to everyone)
// ────────────────────────────────────────────────
publicSignals = [
  "12849372948572984759827498572984759827498",  // commitment
  "98374928374982374982374982374982374982",     // nullifier
  "1733270400",                                  // currentTimestamp
  "18",                                          // minAge
  "120"                                          // maxAge
];

// Notice: dateOfBirth and salt are NOT here!
// They stayed in the witness on the client!
```

### **What Just Happened? (The Math)**

The proof is cryptographic evidence that:

```
∃ (dateOfBirth, salt) such that:
  1. commitment = Poseidon(dateOfBirth, salt)
  2. (currentTimestamp - dateOfBirth) / 31536000 >= 18
  3. (currentTimestamp - dateOfBirth) / 31536000 <= 120
  
WITHOUT revealing dateOfBirth or salt!
```

**Elliptic Curve Pairing Magic:**

```
Groth16 uses bilinear pairings on BN128 curve:

e(A, B) = e(C, D)  ← Pairing equation

Where:
- A, B, C, D are points on elliptic curve
- e() is a pairing function
- If equation holds, proof is valid!

The prover uses proving key to construct A, B, C such that
the pairing equation holds IF AND ONLY IF they know the secrets.
```

---

```typescript
// ═══════════════════════════════════════════════════════════
// STEP 6: Verify Proof Locally (Optional)
// ═══════════════════════════════════════════════════════════

// Location: apps/web/src/lib/zkProofsReal.ts

const vkey = await fetch('/circuits/age_proof/verification_key.json')
  .then(r => r.json());

const verified = await snarkjs.groth16.verify(
  vkey,           // Verification key
  publicSignals,  // Public inputs
  proof           // The proof
);

// verified = true  ✓
// The math checks out! User is 18+

// But we still don't know their birthdate!
```

---

```typescript
// ═══════════════════════════════════════════════════════════
// STEP 7: Send to Verifier Service
// ═══════════════════════════════════════════════════════════

// Location: apps/web/src/components/ZKProofGenerator.tsx

const response = await fetch('https://verifier.zassport.com/verify-age', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    proof: proof,              // 200 bytes
    publicSignals: publicSignals,
    userPublicKey: wallet.publicKey.toString()
  })
});

// ────────────────────────────────────────────────
// Server receives:
// ────────────────────────────────────────────────
// ✓ proof (cryptographic evidence)
// ✓ publicSignals (commitment, nullifier, timestamps)
// ✓ userPublicKey (Solana wallet address)
//
// ✗ dateOfBirth (NEVER sent!)
// ✗ salt (NEVER sent!)
// ✗ witness (NEVER sent!)
```

---

```typescript
// ═══════════════════════════════════════════════════════════
// STEP 8: Server Verifies & Signs Attestation
// ═══════════════════════════════════════════════════════════

// Location: verifier-service/src/server.js

import * as snarkjs from 'snarkjs';
import nacl from 'tweetnacl';

// A. Load verification key
const vkey = JSON.parse(fs.readFileSync('circuits/age_proof/verification_key.json'));

// B. Verify the proof
const isValid = await snarkjs.groth16.verify(
  vkey,
  req.body.publicSignals,
  req.body.proof
);

if (!isValid) {
  return res.status(400).json({ error: 'Invalid proof' });
}

// C. Create attestation message
const attestation = {
  claimType: 'age_verification',
  userPublicKey: req.body.userPublicKey,
  commitment: req.body.publicSignals[0],
  nullifier: req.body.publicSignals[1],
  timestamp: Date.now(),
  programId: 'FR6XtcALdJfPRTLzSyhjt5fJ1eoYsEn8kq4vcGAkd8WQ'
};

// D. Sign attestation with verifier's private key
const message = Buffer.from(JSON.stringify(attestation));
const signature = nacl.sign.detached(
  message,
  verifierKeypair.secretKey  // ED25519 private key
);

// E. Return signed attestation
res.json({
  verified: true,
  attestation: attestation,
  signature: Buffer.from(signature).toString('base64')
});
```

---

```typescript
// ═══════════════════════════════════════════════════════════
// STEP 9: Frontend Stores Attestation On-Chain
// ═══════════════════════════════════════════════════════════

// Location: apps/web/src/components/ZKProofGenerator.tsx

const { attestation, signature } = await response.json();

// Convert signature to format Solana program expects
const signatureBytes = Buffer.from(signature, 'base64');

// Call Solana program to store attestation
const tx = await program.methods
  .storeAttestation(
    Array.from(signatureBytes),           // Verifier signature
    attestation.claimType,
    attestation.commitment,
    attestation.nullifier
  )
  .accounts({
    user: wallet.publicKey,
    attestationAccount: attestationPDA,
    systemProgram: SystemProgram.programId
  })
  .rpc();

// ────────────────────────────────────────────────
// ON-CHAIN STORAGE (Solana)
// ────────────────────────────────────────────────
// Account: [attestationPDA]
// Data stored:
// {
//   verifier_signature: [64 bytes],
//   claim_type: "age_verification",
//   commitment: "12849...498",
//   nullifier: "9837...982",
//   timestamp: 1733270400,
//   is_verified: true
// }
//
// Stored permanently on Solana blockchain!
// Anyone can verify signature came from trusted verifier
// But nobody knows user's actual birthdate!
```

---

## **Part 8: Why This Architecture?**

### **Client-Side Proof Generation:**

```
✅ Advantages:
- User's secrets NEVER leave their device
- No server can see private data
- Fully decentralized (no trust needed)
- Works offline after assets loaded

❌ Challenges:
- Large files (.wasm, .zkey) must be downloaded
- Proof generation takes 2-10 seconds in browser
- Requires modern browser with WASM support
```

### **Server-Side Verification:**

```
✅ Advantages:
- Verification is fast (~50ms)
- Server can sign attestations for blockchain
- Can add additional validation logic
- Rate limiting / abuse prevention

🔐 Security:
- Server never sees private inputs
- Server only sees: proof + public signals
- Cannot reverse-engineer private data from proof
```

---

## **Part 9: Security Properties**

### **Zero-Knowledge Property:**

```
Verifier learns NOTHING except the statement is true.

Formally: ∀ valid proof, ∃ simulator that can generate
          identical proof WITHOUT knowing the secrets.
```

### **Soundness:**

```
Cannot create fake proof unless you break elliptic curve crypto.

Formally: Probability of faking proof < 2^-128
          (requires solving discrete logarithm problem)
```

### **Completeness:**

```
If statement is true and you know secrets, you can
ALWAYS generate a valid proof.

Formally: ∀ valid witness, proof generation succeeds.
```

---

## **Part 10: File Size Summary**

```
📊 Circuit Files Size Breakdown:

Development (circuits/):
├── circuit.circom              ~5 KB    (source code)
├── circuit.r1cs                ~100 KB  (compiled constraints)
├── circuit_0000.zkey           ~10 MB   (initial proving key)
├── circuit_0001.zkey           ~10 MB   (contributed key)
└── circuit_final.zkey          ~10 MB   (final proving key)

Production (apps/web/public/circuits/):
├── circuit.wasm                ~500 KB  (witness calculator)
├── circuit_final.zkey          ~10 MB   (proving key)
└── verification_key.json       ~2 KB    (verifier key)

Powers of Tau (circuits/):
├── pot15_0000.ptau            ~12 MB   (intermediate)
├── pot15_0001.ptau            ~12 MB   (intermediate)
└── pot15_final.ptau           ~37 MB   (final - used for all circuits)

Runtime Generated (browser):
├── witness.wtns               ~100 KB  (never sent)
├── proof.json                 ~200 B   (sent to verifier)
└── publicSignals              ~150 B   (sent to verifier)
```

---

## **Final Summary:**

Your ZK system proves age (and other attributes) without revealing the actual data by:

1. **Compiling** circuits from Circom to R1CS constraints
2. **Setup** with Powers of Tau to generate proving/verifying keys
3. **Generating** witness from private inputs in browser
4. **Proving** using elliptic curve cryptography (Groth16)
5. **Verifying** the proof without seeing private data
6. **Attesting** with server signature
7. **Storing** on blockchain for permanent record

The user's birthdate NEVER leaves their device, yet they can prove they're 18+ to anyone! 🎉


-------------------------------------------------

Here’s the end‑to‑end, from a fresh setup, focused on what the frontend must ship, what changes when, and how the browser actually “does ZK”.

High-level roles
- Build-time (developer machine or CI):
  - Write circuits (.circom), run trusted setup, compile artifacts.
  - Output browser-consumable files.
- Runtime (frontend in user’s browser):
  - Load artifacts (.wasm, .zkey, verification_key.json).
  - Create inputs from the user’s passport data.
  - Compute witness, generate proof, optionally verify locally.
  - Send proof + public signals to your verifier backend; then store on-chain.

What the frontend needs to ship (per circuit)
- circuit.wasm: witness calculator (browser computes the circuit).
- circuit_final.zkey: proving key (browser generates proof).
- verification_key.json: public key (browser or server verifies proof).

These 3 files are static assets you place under apps/web/public so the browser can fetch them over HTTPS.

Fresh setup: step-by-step
1) Author the circuit(s) once
- You create circuits for each claim type (age, nationality, validity).
- Example: circuits/age/circuit.circom

2) Run trusted setup and compile (dev machine)
- One-time per circuit version; outputs browser artifacts.
- Commands (Mac, using circom + snarkjs):
````bash
# 0) Install tools (if not already)
brew install node
npm i -g circom snarkjs

# 1) Go to circuits project
cd /Users/kyto/zk/Zassport/circuits/age

# 2) Compile to R1CS + WASM + symbols
circom circuit.circom --r1cs --wasm --sym

# 3) Powers of Tau (reuse a final ptau sized for your constraints)
# If you don’t have one yet:
# snarkjs powersoftau new bn128 15 pot15_0000.ptau
# snarkjs powersoftau contribute pot15_0000.ptau pot15_final.ptau --name="contrib"

# 4) Groth16 setup → final zkey
snarkjs groth16 setup circuit.r1cs ../pot15_final.ptau circuit_0000.zkey
snarkjs zkey contribute circuit_0000.zkey circuit_0001.zkey --name="contrib"
snarkjs zkey beacon circuit_0001.zkey circuit_final.zkey 0102030405060708090a

# 5) Export verification key
snarkjs zkey export verificationkey circuit_final.zkey verification_key.json
````

3) Copy artifacts to the frontend (public)
- Ship only these three to the web app:
  - ./age_js/circuit.wasm → apps/web/public/circuits/age/v1/circuit.wasm
  - ./circuit_final.zkey → apps/web/public/circuits/age/v1/circuit_final.zkey
  - ./verification_key.json → apps/web/public/circuits/age/v1/verification_key.json

4) Add a circuits manifest (recommended)
- Lets the frontend discover versions/paths and makes upgrades clean.
````json
{
  "age": {
    "version": "v1",
    "wasm": "/circuits/age/v1/circuit.wasm",
    "zkey": "/circuits/age/v1/circuit_final.zkey",
    "vkey": "/circuits/age/v1/verification_key.json"
  },
  "nationality": {
    "version": "v1",
    "wasm": "/circuits/nationality/v1/circuit.wasm",
    "zkey": "/circuits/nationality/v1/circuit_final.zkey",
    "vkey": "/circuits/nationality/v1/verification_key.json"
  }
}
````

5) Frontend: load artifacts and generate a proof
- The browser fetches wasm/zkey, builds inputs from passport data, and calls snarkjs.
````typescript
import * as snarkjs from 'snarkjs';

export type CircuitRef = 'age' | 'nationality';

type ManifestEntry = { version: string; wasm: string; zkey: string; vkey: string; };
type Manifest = Record<CircuitRef, ManifestEntry>;

async function loadManifest(): Promise<Manifest> {
  const res = await fetch('/circuits/manifest.json', { cache: 'no-cache' });
  return res.json();
}

export async function generateProof(circuit: CircuitRef, inputs: any) {
  const manifest = await loadManifest();
  const refs = manifest[circuit];

  // 1) Optional: local verify inputs or normalize here

  // 2) Full prove in browser (computes witness + proof)
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    inputs,
    refs.wasm,
    refs.zkey
  );

  // 3) Optional: local verification
  const vkey = await (await fetch(refs.vkey)).json();
  const ok = await snarkjs.groth16.verify(vkey, publicSignals, proof);
  if (!ok) throw new Error('Local verification failed');

  return { proof, publicSignals, version: refs.version };
}
````

6) Frontend: build inputs from user data (private vs public)
- Example for Age proof:
````typescript
import { buildPoseidon } from 'circomlibjs';

export async function buildAgeInputs(passport: {
  dateOfBirth: string; // "YYYY-MM-DD"
}, minAge = 18, maxAge = 120) {
  const poseidon = await buildPoseidon();
  const dobTs = Math.floor(new Date(passport.dateOfBirth).getTime() / 1000);
  const salt = BigInt(Math.floor(Math.random() * 2 ** 30));
  const commitment = poseidon([BigInt(dobTs), salt]);
  const nullifier = poseidon([commitment]);

  return {
    // Public
    commitment: commitment.toString(),
    nullifier: nullifier.toString(),
    currentTimestamp: Math.floor(Date.now() / 1000).toString(),
    minAge: String(minAge),
    maxAge: String(maxAge),
    // Private
    dateOfBirth: String(dobTs),
    salt: salt.toString()
  };
}
````

7) Frontend: call the prover and send to verifier service
````typescript
// ...existing code...
import { buildAgeInputs } from '@/lib/zk/inputs';
import { generateProof } from '@/lib/zk/prover';

async function onGenerateAgeProof(passportData) {
  const inputs = await buildAgeInputs(passportData, 18, 120);
  const { proof, publicSignals } = await generateProof('age', inputs);

  // Send to verifier (backend) for attestation/signature
  const res = await fetch(process.env.NEXT_PUBLIC_VERIFIER_URL + '/verify-age', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ proof, publicSignals, wallet: wallet.publicKey.toBase58() })
  });
  const { signature, attestation } = await res.json();

  // Then submit attestation + signature on-chain (program instruction)
  // ...existing code...
}
````

What changes vs what stays fixed
- Fixed (until you change the circuit):
  - circuit.wasm, circuit_final.zkey, verification_key.json paths and contents.
  - The structure (public inputs expected, private inputs expected).
- Changes when:
  - You modify the circuit logic or parameters affecting constraints:
    - You must recompile (new wasm), regenerate zkey (new proving key), and export a new vkey.
    - Bump version: put them under /circuits/<name>/v2/ and update manifest.json.
  - You exceed your Powers-of-Tau size (too many constraints):
    - You must generate or reuse a larger potXX_final.ptau, then redo setup to get a new zkey.
  - You rotate trusted setup (security reasons):
    - New zkey and vkey even if the circuit source is identical.
  - You only change runtime inputs (minAge, dates, passport fields):
    - No artifact changes needed; the browser just passes different inputs.

Where artifacts are produced vs used
- Produced: during build-time on your machine/CI (circom/snarkjs).
- Used: at runtime by the browser; you never compile circuits in the browser.

What your frontend “does” during ZK
- Downloads artifacts (wasm, zkey, vkey).
- Builds inputs from local passport data (private fields never leave browser).
- Uses wasm to compute a witness (all intermediate values, including secrets).
- Uses zkey to produce a Groth16 proof (~200 bytes).
- Optionally verifies proof locally with vkey.
- Sends proof + publicSignals to your verifier backend for attestation.
- Submits verifier signature to Solana program to mark verified claims on-chain.

Recommended repo layout
````text
apps/web/
  public/
    circuits/
      manifest.json
      age/
        v1/
          circuit.wasm
          circuit_final.zkey
          verification_key.json
      nationality/
        v1/
          circuit.wasm
          circuit_final.zkey
          verification_key.json
circuits/
  age/
    circuit.circom
    circuit.r1cs
    circuit_final.zkey
    verification_key.json
    age_js/               # generated wasm folder
      circuit.wasm
  pot15_final.ptau
````

Versioning & cache strategy
- Use versioned folders (v1, v2, …).
- Optionally add content hashes to filenames (circuit-v1-<hash>.zkey) to leverage immutable caching on Vercel CDN.
- Keep manifest.json as the single switch you update on deploy.
- Never overwrite old versions in-place; avoid cache-stale issues.

When you don’t need to rebuild artifacts
- Changing UI/UX, copy, or inputs (e.g., minAge from 18 to 21) → no artifact change.
- Adding new proof instances of the same circuit (new user, new passport) → no artifact change.

When you must rebuild artifacts
- Any change in circuit.circom that changes constraints.
- Moving to a different PTau or re-running ceremony.
- Switching proving systems (e.g., Groth16 → Plonk) requires a different toolchain and artifact set.

What NOT to push to frontend
- .r1cs (dev artifact).
- intermediate .zkey (circuit_0000.zkey, circuit_0001.zkey).
- witness.wtns (runtime only, private).
- pot*_000*.ptau (intermediate ceremony files).

Quick checklist for a fresh project
- Circuits:
  - Write circuit.circom.
  - Compile and run Groth16 setup using final ptau → get wasm, final zkey, vkey.
- Frontend:
  - Place wasm/zkey/vkey under public/circuits/<name>/vX/.
  - Add public/circuits/manifest.json pointing to current versions.
  - Implement a prover helper that loads manifest and calls snarkjs.groth16.fullProve.
  - Build inputs from private data, generate proof, send to verifier.
- Verifier backend:
  - Keep the same vkey server-side to verify proofs.
  - Sign attestation and return signature to frontend.

If you want, I can add the manifest + prover scaffolding to your repo now so the frontend uses versioned circuits cleanly.