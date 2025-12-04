# Zassport Mobile App

Privacy-Preserving Passport Verification using Zero-Knowledge Proofs and NFC.

## Features

- 📱 **NFC Passport Reading**: Scan e-Passports using NFC technology
- 🔐 **ZK Proof Generation**: Generate zero-knowledge proofs on-device
- 💼 **Solana Wallet Integration**: Connect with Solana mobile wallets
- 🛡️ **Privacy First**: Your passport data never leaves your device

## Tech Stack

- React Native (Expo)
- React Native NFC Manager
- Solana Mobile Wallet Adapter
- Circom ZK Circuits (WASM)
- TypeScript

## Setup

```bash
# Install dependencies
npm install

# Start development server
npx expo start

# Run on iOS
npx expo run:ios

# Run on Android
npx expo run:android
```

## NFC Requirements

### iOS
- iPhone 7 or later
- iOS 13 or later
- Enable NFC in app capabilities

### Android
- NFC-enabled device
- Android 5.0 (API level 21) or later
- NFC permission in AndroidManifest.xml

## Project Structure

```
mobile/
├── app/                    # Expo Router screens
│   ├── (tabs)/            # Tab navigation
│   │   ├── index.tsx      # Home/Scan screen
│   │   ├── proofs.tsx     # Generated proofs
│   │   └── profile.tsx    # User profile
│   └── _layout.tsx        # Root layout
├── components/            # Reusable components
│   ├── NFCScanner.tsx    # NFC passport scanner
│   ├── ProofGenerator.tsx # ZK proof generation
│   └── WalletConnect.tsx # Solana wallet connection
├── lib/                   # Utilities
│   ├── nfc.ts            # NFC operations
│   ├── zk.ts             # ZK proof generation
│   └── solana.ts         # Solana interactions
└── assets/               # Images and fonts
```

## Usage

### 1. Scan Passport
```typescript
import { scanPassport } from '@/lib/nfc';

const passportData = await scanPassport();
// Returns: documentNumber, dateOfBirth, nationality, etc.
```

### 2. Generate ZK Proof
```typescript
import { generateAgeProof } from '@/lib/zk';

const proof = await generateAgeProof({
  dateOfBirth: passportData.dateOfBirth,
  minAge: 18,
  maxAge: 120
});
```

### 3. Submit to Solana
```typescript
import { submitProofToChain } from '@/lib/solana';

await submitProofToChain(proof, wallet);
```

## Privacy & Security

- All passport data processing happens on-device
- Private keys never leave the secure enclave
- ZK proofs reveal no personal information
- NFC communication is encrypted (BAC/PACE)

## License

MIT

## Hackathon

Built for Network School Zcash Hackathon 2025
