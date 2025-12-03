# 🚀 Zassport Production Setup & Testing Guide (Mac → Android)

## 📋 Prerequisites

### On Mac:
- Node.js 18+ installed
- Android Studio installed (for ADB)
- Android phone connected via USB with USB debugging enabled
- Expo CLI: `npm install -g expo-cli`

## 🏗️ Production Architecture

```
┌─────────────────┐
│  Android Phone  │
│   (Real Device) │
└────────┬────────┘
         │
         ↓ HTTPS (Expo Tunnel)
┌─────────────────┐
│   Mac (Dev)     │
│  ├─ Verifier    │ ← Generates ZK Proofs (Server-Side)
│  ├─ Sanctions   │ ← OFAC/UN/EU Check
│  └─ Metro       │ ← React Native Bundler
└────────┬────────┘
         │
         ↓ RPC
┌─────────────────┐
│  Solana Devnet  │ ← On-Chain Attestations
└─────────────────┘
```

## 🔧 Complete Setup Steps

### 1. Install Dependencies

```bash
cd /Users/kyto/zk/Zassport

# Install all dependencies
npm install

# Install mobile dependencies
cd apps/mobile
npm install

# Install verifier dependencies
cd ../../verifier-service
npm install
```

### 2. Start Backend Services

Open **3 separate terminal windows**:

#### Terminal 1: Sanctions Oracle
```bash
cd /Users/kyto/zk/Zassport/services/sanctions-oracle
npm start
```
✅ Should show: `Sanctions Oracle running on port 3002`

#### Terminal 2: Verifier Service (with Proof Generation)
```bash
cd /Users/kyto/zk/Zassport/verifier-service
npm start
```
✅ Should show: 
```
🚀 Verifier service running on http://localhost:3000
📱 Mobile proof generation: http://localhost:3000/api/generate-proofs
```

#### Terminal 3: Mobile App (Expo)
```bash
cd /Users/kyto/zk/Zassport/apps/mobile
npx expo start --tunnel
```

### 3. Connect Android Phone

#### On Android Phone:
1. Enable **Developer Options**:
   - Go to Settings → About Phone
   - Tap "Build Number" 7 times
   
2. Enable **USB Debugging**:
   - Settings → Developer Options → USB Debugging (ON)

3. Install **Expo Go** from Play Store

4. Connect phone to Mac via USB

5. Verify connection:
```bash
# On Mac
adb devices
# Should show your device
```

### 4. Load App on Phone

#### Option A: Scan QR Code (Recommended)
1. Open **Expo Go** app on phone
2. Tap **Scan QR Code**
3. Scan the QR code from Terminal 3
4. App will load

#### Option B: Direct URL
1. Note the tunnel URL from Terminal 3: `exp://xxxxx.exp.direct`
2. In Expo Go, tap **Enter URL manually**
3. Paste the URL

## 🧪 Complete Testing Flow (Tier 1-2-3)

### Test Scenario: Indian Passport Verification

#### 1. Check Service Status
On the app's home screen, verify:
- 🟢 **Solana**: Green (Devnet connected)
- 🟢 **Verifier**: Green (localhost:3000)
- 🟢 **Sanctions**: Green (localhost:3002)
- 🔴 **NFC**: Red (Expected - Expo Go limitation)

#### 2. Connect Wallet
1. Tap **"Connect Wallet"**
2. Enter a Solana wallet address (or use test):
   ```
   9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin
   ```
3. ✅ Wallet connected

#### 3. Load Passport Data
Since NFC isn't available in Expo Go:

1. Scroll to **"📄 Passport Data"**
2. Tap **"Use Test Data"** button
3. ✅ Should load:
   ```
   Name: Test User
   Nationality: IND (India)
   DOB: 950315 (15 March 1995)
   Expiry: 280101 (01 Jan 2028)
   ```

#### 4. Generate ZK Proofs (Server-Side)
1. Tap **"Generate Proofs"** button
2. Watch the **"🔒 ZK Proofs"** section:
   - Age Proof: Generating → ✅ Verified
   - Nationality Proof: Generating → ✅ Verified
   - Validity Proof: Generating → ✅ Verified
   - Sanctions Check: Generating → ✅ Not on OFAC list

3. **Behind the scenes:**
   - App sends passport data to `http://localhost:3000/api/generate-proofs`
   - Verifier generates proofs using snarkjs
   - Checks sanctions via `localhost:3002`
   - Returns proofs to mobile app

#### 5. Submit On-Chain (Solana)
1. Tap **"Submit On-Chain"** button
2. Watch for success message
3. ✅ Attestations written to Solana devnet PDAs

### Expected Results:
```
✅ Age Proof: User is 18+ years old
✅ Nationality Proof: User is from India (356)
✅ Validity Proof: Passport not expired
✅ Sanctions Check: Not on OFAC/UN/EU lists
✅ On-Chain: 4 PDAs written to Solana devnet
```

## 🔍 Verification

### Check Verifier Logs
In Terminal 2, you should see:
```
[ProofGen] Generating proofs for passport: L898902C3
[ProofGen] Generating age proof...
[ProofGen] Generating nationality proof...
[ProofGen] Generating validity proof...
[ProofGen] Generating sanctions proof...
[ProofGen] All proofs generated successfully
```

### Check Sanctions Logs
In Terminal 1:
```
Checking sanctions for: <documentHash>
Not found on any sanctions list
```

### Check Solana (Optional)
```bash
# View attestation PDA (replace with actual address from logs)
solana account <PDA_ADDRESS> --url devnet
```

## 🐛 Troubleshooting

### Issue: Red Verifier/Sanctions Status
**Solution:**
```bash
# Check if services are running
curl http://localhost:3000/health
curl http://localhost:3002/health
```

### Issue: "Network request failed"
**Cause:** Phone can't reach localhost on Mac

**Solution:** Use ngrok tunnel (already enabled with `--tunnel`)
```bash
# Verifier should be accessible via tunnel
# Check expo terminal for tunnel URL
```

### Issue: NFC Error
**This is expected!** NFC only works in development builds, not Expo Go.

To enable NFC:
```bash
cd /Users/kyto/zk/Zassport/apps/mobile
npx expo prebuild --platform android
npx expo run:android
```

### Issue: Proof Generation Fails
**Check:**
1. Are circuits available?
   ```bash
   ls -la /Users/kyto/zk/Zassport/circuits/build/
   ```
2. Is verifier service running?
3. Check verifier logs for errors

## 📊 Production Deployment

### Backend Services:
```bash
# Deploy verifier + sanctions oracle to cloud (AWS/GCP/Azure)
# Use PM2 for process management
pm2 start verifier-service/src/server.js --name verifier
pm2 start services/sanctions-oracle/index.ts --name sanctions
```

### Mobile App:
```bash
# Build production APK
cd apps/mobile
eas build --platform android --profile production
```

### Solana Program:
```bash
# Deploy to mainnet
cd programs
anchor build
anchor deploy --provider.cluster mainnet
```

## 🎯 Key Features Working

✅ **Tier 1: Age Verification**
- Proves user is 18+ without revealing exact DOB
- Server-side ZK proof generation
- On-chain attestation

✅ **Tier 2: Nationality Verification**
- Proves nationality from allowed list
- Zero-knowledge proof
- Multi-country support (IND/USA/UK)

✅ **Tier 3: Sanctions Screening**
- OFAC/UN/EU sanctions check
- Merkle proof generation
- Real-time sanctions data

✅ **Privacy Guaranteed**
- No raw passport data stored
- ZK proofs reveal only required attributes
- Cryptographic commitments & nullifiers
- On-chain verification

## 📱 Next Steps

1. **Test with real Indian passport** (requires development build for NFC)
2. **Deploy backend to cloud** for remote access
3. **Build production APK** with `eas build`
4. **Deploy Solana program** to mainnet
5. **Add biometric authentication** for wallet security

---

**Status:** ✅ Production-ready for testing with test data
**Platform:** Mac (M1/M2/Intel) → Android 8+
**Tech Stack:** React Native + Expo SDK 52 + Solana + ZK-SNARKs
