# 🎯 ZK Passport User Flow - IDEAL vs CURRENT

## 📊 **WHAT WE'RE BUILDING**

**Goal**: Privacy-preserving identity verification using passport + zero-knowledge proofs  
**Track**: ZK Passport (Hackathon)  
**Privacy**: Prove attributes (age 18+, nationality) without revealing raw passport data  

---

## ✅ **IDEAL FLOW** (What Should Happen)

```
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 1: SCAN PASSPORT (/scan)                                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ User Journey:                                                        │
│  1. User opens /scan page                                           │
│  2. Clicks "Scan with Camera" button                                │
│  3. Points camera at passport MRZ (bottom 2 lines)                  │
│  4. Clicks "Capture" when MRZ is visible                            │
│  5. OCR extracts data (name, DOB, nationality, doc number, expiry)  │
│  6. Sees success message with parsed data                           │
│  7. Clicks "Continue to Registration"                               │
│                                                                      │
│ What Happens Behind the Scenes:                                     │
│  ✅ Tesseract.js performs OCR on camera image                       │
│  ✅ MRZ parser extracts structured passport data                    │
│  ✅ Data saved to sessionStorage for next step                      │
│  ✅ User automatically redirected to /claims                        │
│  ✅ Registration form pre-filled with scanned data                  │
│                                                                      │
│ Privacy Notes:                                                       │
│  • All processing happens IN THE BROWSER (no server upload)         │
│  • Camera access terminates after capture                           │
│  • sessionStorage cleared after registration                        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 2: REGISTER IDENTITY (/claims - "Register Identity" section)  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ User Journey:                                                        │
│  1. Arrives at /claims page                                         │
│  2. Sees "Register Identity" form PRE-FILLED with scanned data      │
│  3. Reviews the data for accuracy                                   │
│  4. Clicks "Register Identity" button                               │
│  5. Sees "Checking if identity exists..."                           │
│  6. Wallet prompts for transaction signature                        │
│  7. Sees "Identity registered on Solana!"                           │
│                                                                      │
│ What Happens Behind the Scenes:                                     │
│  ✅ Load passport data from sessionStorage                          │
│  ✅ Check if identity PDA already exists on-chain                   │
│     - If exists: Show "Already registered" + skip to proofs         │
│     - If not: Continue with registration                            │
│  ✅ Generate commitment = Poseidon(passport_data)                   │
│  ✅ Call program.methods.registerIdentity(commitment)               │
│  ✅ Store identity on Solana (commitment + nullifier)               │
│  ✅ Save passport data to React Context for proof generation        │
│  ✅ Clear sessionStorage (security cleanup)                         │
│  ✅ Show success + enable proof generation                          │
│                                                                      │
│ On-Chain Data (Solana):                                             │
│  • Identity PDA created at: seeds=[b"identity", wallet_pubkey]      │
│  • Stores: commitment (hash), nullifier, timestamp                  │
│  • Does NOT store: name, DOB, nationality, doc number               │
│                                                                      │
│ Privacy Notes:                                                       │
│  • Only commitment (hash) goes on-chain                             │
│  • Raw passport data NEVER leaves browser                           │
│  • Commitment binds data without revealing it                       │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 3: GENERATE ZK PROOF (/claims - "ZK Proof Generator" section) │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ User Journey:                                                        │
│  1. Scrolls to "ZK Proof Generator" section                         │
│  2. Sees "Using registered passport data ✓"                         │
│  3. Selects proof type: "Age Verification"                          │
│  4. Sets minimum age: 18                                            │
│  5. Clicks "Generate Proof"                                         │
│  6. Sees "Generating ZK proof..." (15-30 seconds)                   │
│  7. Sees "Proof generated! Submitting to verifier..."              │
│  8. Sees "Age verified on-chain! ✅"                                │
│                                                                      │
│ What Happens Behind the Scenes:                                     │
│  ✅ Use passport data from React Context (from registration)        │
│  ✅ Calculate age from DOB                                          │
│  ✅ Generate ZK proof client-side using snarkjs:                    │
│     - Circuit: age_verification.circom                              │
│     - Inputs: DOB, current_date, min_age                            │
│     - Outputs: commitment, nullifier, isValid (true/false)          │
│     - Privacy: Proof reveals NOTHING about actual DOB               │
│  ✅ Send proof to verifier service (POST /verify)                   │
│  ✅ Verifier checks proof validity + signs with Ed25519             │
│  ✅ Submit to Solana: program.methods.attestAgeProof(proof, sig)   │
│  ✅ Update on-chain identity: age_verified = true                   │
│  ✅ Show in "My Claims": "Age (18+) Verified ✓"                    │
│                                                                      │
│ ZK Proof Contents (simplified):                                     │
│  • Public Inputs: commitment, nullifier, min_age (18)               │
│  • Private Inputs: DOB (hidden!)                                    │
│  • Proof: π (cryptographic proof that age >= 18)                    │
│                                                                      │
│ Verifier Service Role:                                              │
│  • Validates proof cryptographically                                │
│  • Signs with trusted Ed25519 key                                   │
│  • Returns signature to frontend                                    │
│  • Smart contract trusts verifier's signature                       │
│                                                                      │
│ On-Chain Update:                                                     │
│  • Identity PDA updated: age_verified = true                        │
│  • Attestation stored with timestamp                                │
│  • Anyone can query: "Is this wallet 18+?" → YES (without DOB)     │
│                                                                      │
│ Privacy Notes:                                                       │
│  • Proof reveals: "Age >= 18" (boolean)                             │
│  • Proof HIDES: actual birthdate, exact age                         │
│  • On-chain: only stores true/false flag                            │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 4: VIEW & USE CLAIMS (/claims - "My Claims" section)          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ User Journey - View Claims:                                         │
│  1. Scrolls to "My Claims" section                                  │
│  2. Sees verified claims:                                           │
│     ✅ Age Verification (18+) - Verified 2 minutes ago              │
│     ❌ Nationality Verification - Not verified yet                  │
│     ❌ Sanctions Check - Not verified yet                           │
│  3. Clicks "Export as W3C Verifiable Credential"                    │
│  4. Downloads JSON file with all verified claims                    │
│                                                                      │
│ User Journey - Use in DeFi:                                         │
│  Scenario A: Age-Gated DeFi Protocol                                │
│   1. Opens external DeFi app (e.g., age-restricted staking)        │
│   2. DeFi app asks: "Prove you're 18+"                             │
│   3. Connects Solana wallet                                         │
│   4. DeFi app reads identity PDA from blockchain                    │
│   5. Checks: identity.age_verified == true                          │
│   6. Grants access WITHOUT seeing birthdate                         │
│                                                                      │
│  Scenario B: Country-Restricted Protocol                            │
│   1. Opens protocol that blocks certain countries                   │
│   2. User generates nationality proof (proves "NOT from X")         │
│   3. Protocol verifies proof on-chain                               │
│   4. Grants access without knowing actual nationality               │
│                                                                      │
│ What External Apps See:                                             │
│  ✅ Can see: age_verified = true/false                              │
│  ✅ Can see: nationality_verified = true/false                      │
│  ✅ Can see: sanctions_checked = true/false                         │
│  ❌ Cannot see: actual DOB, name, passport number                   │
│  ❌ Cannot see: exact age (only "18+" boolean)                      │
│  ❌ Cannot see: specific nationality (only "allowed" boolean)       │
│                                                                      │
│ Privacy Guarantees:                                                  │
│  • Only commitments (hashes) stored on-chain                        │
│  • Only boolean flags for verifications                             │
│  • Raw passport data NEVER on-chain, NEVER on backend               │
│  • User controls what proofs to generate                            │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## ❌ **CURRENT FLOW** (What's Broken)

```
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 1: SCAN PASSPORT - ✅ MOSTLY WORKING                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ ✅ Camera opens correctly                                           │
│ ✅ OCR extracts MRZ data                                            │
│ ✅ Shows parsed passport information                                │
│ ❌ BUG: Data saved to sessionStorage BUT...                         │
│ ❌ BUG: User clicks "Continue" → redirects to /claims               │
│ ❌ BUG: Registration form is EMPTY (doesn't load sessionStorage)    │
│ ❌ BUG: User must manually type everything AGAIN                    │
│                                                                      │
│ Root Cause:                                                          │
│  - scan/page.tsx saves data correctly                               │
│  - claims/page.tsx doesn't check sessionStorage on mount            │
│  - IdentityRegistration.tsx has empty form with no auto-fill        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 2: REGISTER IDENTITY - ⚠️ WORKS BUT DISCONNECTED               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ ❌ BUG: Form doesn't auto-fill from scanned data                    │
│ ❌ BUG: User must manually type everything                          │
│ ✅ Registration works IF user manually enters data                  │
│ ✅ Creates identity PDA on Solana correctly                         │
│ ✅ Stores commitment on-chain                                       │
│ ❌ BUG: Passport data NOT saved to React Context                    │
│ ❌ BUG: Data lost after registration                                │
│ ❌ BUG: No check if identity already exists                         │
│                                                                      │
│ Root Cause:                                                          │
│  - No React Context for passport data                               │
│  - Registration component doesn't persist data after submit         │
│  - Missing identity existence check before registration             │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 3: GENERATE PROOF - ❌ COMPLETELY BROKEN                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ ❌ BUG: Proof generator uses TEST DATA (hardcoded dummy passport)   │
│ ❌ BUG: Doesn't use actual registered passport data                 │
│ ❌ BUG: User sees "Proof generated" but it's for fake data          │
│ ❌ BUG: No connection between registration and proof generation     │
│ ❌ BUG: Verifier service not deployed (returns 404)                 │
│ ❌ BUG: Can't attest proofs on-chain (missing verifier signature)   │
│                                                                      │
│ Current Bad Flow:                                                    │
│  1. User clicks "Generate Proof"                                    │
│  2. Code calls: getTestPassportData() ← WRONG!                      │
│  3. Generates proof for FAKE passport                               │
│  4. User thinks it worked but proof is useless                      │
│                                                                      │
│ Root Cause:                                                          │
│  - ZKProofGenerator.tsx line 38: uses getTestPassportData()         │
│  - Should use: passport data from registration step                 │
│  - No context/state to access real passport data                    │
│  - Verifier service exists but not deployed                         │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔧 **WHAT NEEDS TO BE FIXED**

### **Issue 1: Scan → Registration Data Loss**
**Problem**: Scanned passport data doesn't auto-fill registration form  
**Solution**: Load sessionStorage in IdentityRegistration component on mount

### **Issue 2: No Passport Data Context**
**Problem**: Registration and proof generation are disconnected  
**Solution**: Create React Context to store passport data across components

### **Issue 3: Proof Generator Uses Test Data**
**Problem**: Always generates proofs for fake passport  
**Solution**: Use real passport data from context instead of getTestPassportData()

### **Issue 4: No Identity Existence Check**
**Problem**: Can register multiple times, wastes gas  
**Solution**: Check if identity PDA exists before showing registration button

### **Issue 5: Verifier Service Not Deployed**
**Problem**: Can't attest proofs on-chain (missing Ed25519 signature)  
**Solution**: Deploy verifier service to Render.com/Railway/Fly.io

---

## 📋 **FIXES TO IMPLEMENT**

1. ✅ Create PassportDataContext for global state
2. ✅ Auto-fill registration form from sessionStorage
3. ✅ Save passport data to context after registration
4. ✅ Make proof generator use context data (not test data)
5. ✅ Add identity existence check before registration
6. ⚠️ Deploy verifier service (separate task - requires backend hosting)

---

## 🎯 **EXPECTED OUTCOME AFTER FIXES**

```
User Experience:
  1. Scan passport → data captured ✅
  2. Auto-redirected to /claims ✅
  3. Form pre-filled with scanned data ✅
  4. Click "Register Identity" → on-chain registration ✅
  5. Passport data stored in context ✅
  6. Generate proof → uses REAL data ✅
  7. Proof verified by backend service ✅
  8. Attestation stored on Solana ✅
  9. Claims visible in "My Claims" ✅
  10. External DeFi apps can verify claims ✅

Privacy Maintained:
  • Raw passport data: ONLY in browser memory (never on-chain)
  • Commitment (hash): Stored on-chain
  • Proofs: Reveal only boolean attributes (age >= 18)
  • Verifications: Stored as flags (true/false)
```

---

**Next Steps**: Implement fixes 1-5 now, then guide user through deploying verifier service.
