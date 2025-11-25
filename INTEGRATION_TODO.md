# Integration TODO List

## Web App Integration (Priority: HIGH)

### 1. Add Solana Wallet Adapter
- [ ] Install dependencies:
  ```bash
  npm install @solana/wallet-adapter-react \
              @solana/wallet-adapter-react-ui \
              @solana/wallet-adapter-wallets \
              @solana/wallet-adapter-base
  ```
- [ ] Update WalletProvider.tsx with real wallet adapter
- [ ] Replace mock wallet connection with real Phantom/Solflare
- [ ] Test wallet connection on devnet

### 2. Connect to Deployed Smart Contract
- [ ] Install Anchor client library:
  ```bash
  npm install @coral-xyz/anchor
  ```
- [ ] Copy IDL from target/idl/zassport.json
- [ ] Create Anchor program provider
- [ ] Initialize program with deployed address
- [ ] Test calling instructions

### 3. Integrate Real ZK Proof Generation
- [ ] Copy circuit files to public/:
  - public/circuits/age_proof/circuit.wasm
  - public/circuits/age_proof/trusted_setup_final.zkey
  - (same for nationality_proof and passport_verifier)
- [ ] Update zkProofs.ts to use real snarkjs
- [ ] Test proof generation in browser
- [ ] Handle large file loading (wasm/zkey are ~5-10MB each)

### 4. Connect Proof Generation to Blockchain
- [ ] Generate proof from passport data
- [ ] Format proof for smart contract
- [ ] Call verify_age_proof instruction
- [ ] Handle transaction confirmation
- [ ] Display success/error messages

### 5. Real Governance Data
- [ ] Fetch proposals from blockchain
- [ ] Fetch identities for leaderboard
- [ ] Real-time vote updates
- [ ] Transaction signing for votes

---

## Mobile App Integration (Priority: MEDIUM)

### 1. Implement Real NFC Reading
- [ ] Add iOS NFC entitlements in app.json
- [ ] Request NFC permissions
- [ ] Implement NFC tag reading
- [ ] Parse ICAO 9303 NDEF data
- [ ] Extract MRZ fields
- [ ] Verify passport chip signature

### 2. Add Solana Mobile Wallet
- [ ] Install @solana-mobile/mobile-wallet-adapter-protocol
- [ ] Implement wallet connection
- [ ] Handle transaction signing
- [ ] Test on Android/iOS

### 3. Client-Side Proof Generation (Optional)
- [ ] Bundle circuit.wasm with app (or use web version)
- [ ] Generate proofs on device
- [ ] Submit to blockchain via wallet

---

## Testing & Polish (Priority: LOW)

### 1. End-to-End Testing
- [ ] Test full flow: Scan → Generate → Verify → Blockchain
- [ ] Test governance: Create → Vote → Execute
- [ ] Test error cases: Invalid proofs, rejected transactions
- [ ] Performance testing: Large circuits, slow networks

### 2. UI/UX Improvements
- [ ] Loading states for blockchain calls
- [ ] Error messages with retry logic
- [ ] Success animations
- [ ] Mobile responsive design

### 3. Security
- [ ] Secure passport data storage
- [ ] Clear sensitive data after use
- [ ] Rate limiting on proof generation
- [ ] Input validation

---

## Demo Preparation

### 1. Video Demo
- [ ] Record web app demo
- [ ] Record mobile app demo
- [ ] Show blockchain transactions
- [ ] Explain architecture

### 2. Hackathon Submission
- [ ] Upload video
- [ ] Submit GitHub link
- [ ] Fill out form
- [ ] Share on social media

---

## Estimated Time

- **Web Integration**: 3-4 hours
- **Mobile NFC**: 4-6 hours  
- **Testing**: 2-3 hours
- **Demo**: 1-2 hours

**Total**: ~10-15 hours to full integration
