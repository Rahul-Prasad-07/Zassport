# Zassport: Privacy-Preserving Passport Verification

[![Solana](https://img.shields.io/badge/Solana-Devnet-9945FF?logo=solana)](https://explorer.solana.com/address/5sCDzoF1pzHisqrrpmfbDynCdjgBJX9FcmVBvJzBio2V?cluster=devnet)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Circom](https://img.shields.io/badge/Circom-v2.1.6-purple)](https://github.com/iden3/circom)

> **Network School Zcash Hackathon Submission** - Privacy-preserving identity verification using zero-knowledge proofs on Solana

## 🎯 Overview

Zassport is a decentralized identity verification system that enables users to prove facts about their passport (age, nationality, document validity) without revealing sensitive personal information. Built on Solana with Circom ZK circuits, it combines the security of blockchain with privacy-first cryptography.

### Key Features

- **🔐 Zero-Knowledge Proofs**: Prove you're over 18, from a specific country, or have a valid passport without revealing personal data
- **📱 Mobile NFC Scanner**: Read passport data directly from the chip using your smartphone
- **⛓️ On-Chain Verification**: All proofs are verified and stored on Solana blockchain
- **🗳️ Decentralized Governance**: Community-driven protocol decisions with reputation-weighted voting
- **🛡️ Privacy-First**: Your passport data never leaves your device - only proofs go on-chain

## 🏗️ Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Mobile App     │────▶│  ZK Circuit      │────▶│  Solana Chain   │
│  (React Native) │     │  (Circom)        │     │  (Anchor)       │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                       │                          │
        │                       ▼                          ▼
    NFC Scan            Proof Generation          On-Chain Verification
    Passport            (Groth16)                 Smart Contracts
```

### Technology Stack

- **Blockchain**: Solana (Devnet)
- **Smart Contracts**: Anchor Framework v0.32.1
- **ZK Circuits**: Circom v2.1.6 with Groth16 proving system
- **Web App**: Next.js 14+, TypeScript, Tailwind CSS
- **Mobile App**: React Native with Expo ~50.0.0
- **Libraries**: snarkjs, circomlibjs, @solana/web3.js

## 📦 Project Structure

```
Zassport/
├── programs/zassport/        # Solana smart contracts (Anchor)
│   └── src/
│       ├── lib.rs            # Main program logic
│       ├── state.rs          # Account structures
│       ├── errors.rs         # Error definitions
│       └── instructions/     # Individual instructions
├── circuits/                 # ZK circuits (Circom)
│   ├── passport_verifier/    # RSA signature verification
│   ├── age_proof/            # Age range proof (18+)
│   └── nationality_proof/    # Nationality verification
├── apps/
│   ├── web/                  # Next.js web application
│   │   └── src/
│   │       ├── app/          # Pages and routes
│   │       ├── components/   # React components
│   │       └── lib/          # Utilities and helpers
│   └── mobile/               # React Native mobile app
│       ├── app/              # Expo Router pages
│       └── components/       # Mobile components
└── tests/                    # Integration tests
```

## 🚀 Getting Started

### Prerequisites

```bash
# Install Rust and Solana
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
sh -c "$(curl -sSfL https://release.solana.com/v1.18.0/install)"

# Install Anchor
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install 0.32.1
avm use 0.32.1

# Install Circom
curl -L https://github.com/iden3/circom/releases/download/v2.1.6/circom-linux-amd64 -o circom
chmod +x circom
sudo mv circom /usr/local/bin/

# Install Node.js dependencies
npm install -g yarn
```

### Build & Deploy

```bash
# 1. Build smart contracts
anchor build

# 2. Set Solana to devnet
solana config set --url devnet

# 3. Get devnet SOL (if needed)
solana airdrop 2

# 4. Deploy contracts
anchor deploy

# 5. Compile ZK circuits
cd circuits/passport_verifier
./compile.sh

cd ../age_proof
./compile.sh

cd ../nationality_proof
./compile.sh

# 6. Run web app
cd apps/web
npm install
npm run dev

# 7. Run mobile app
cd apps/mobile
npm install
npx expo start
```

## 💡 Usage

### Generate an Age Proof

```typescript
import { generateAgeProof } from '@/lib/zkProofs';

const passportData = {
  dateOfBirth: '1990-08-12',
  documentNumber: 'L898902C3',
  nationality: 'USA',
  // ... other fields
};

// Generate proof that user is 18+
const { proof, publicSignals } = await generateAgeProof(passportData);

// Submit to blockchain
await program.methods
  .verifyAgeProof(proof, publicSignals)
  .accounts({ /* ... */ })
  .rpc();
```

### Verify Nationality

```typescript
import { generateNationalityProof } from '@/lib/zkProofs';

// Prove you're from USA without revealing other data
const { proof, publicSignals } = await generateNationalityProof(
  passportData,
  840 // USA country code
);

await program.methods
  .verifyNationalityProof(proof, publicSignals)
  .accounts({ /* ... */ })
  .rpc();
```

### Mobile NFC Scanning

```typescript
import NFCScanner from '@/components/NFCScanner';

<NFCScanner 
  onScanComplete={(passportData) => {
    console.log('Passport scanned:', passportData);
    // Generate proofs
  }} 
/>
```

## 🔬 Smart Contract Instructions

### Core Instructions

1. **initialize** - Set up the protocol with initial parameters
2. **verify_passport_proof** - Verify RSA signature ZK proof
3. **register_identity** - Register a new verified identity
4. **update_reputation** - Modify user reputation score
5. **verify_age_proof** - Verify age range proof (18+)
6. **verify_nationality_proof** - Verify nationality claim
7. **create_proposal** - Create governance proposal
8. **cast_vote** - Vote on active proposal

### Account Structures

```rust
#[account]
pub struct Identity {
    pub authority: Pubkey,
    pub commitment: [u8; 32],
    pub nullifier: [u8; 32],
    pub verified_at: i64,
    pub reputation: u64,
}

#[account]
pub struct Proposal {
    pub proposer: Pubkey,
    pub title: String,
    pub options: Vec<String>,
    pub votes: Vec<u64>,
    pub end_time: i64,
}
```

## 🧪 ZK Circuits

### 1. Passport Verifier (474 constraints)

Verifies RSA-2048 signature on passport data.

**Inputs:**
- `message[32]` - Passport data hash
- `signature[256]` - RSA signature
- `modulus[256]` - Public key modulus

**Output:**
- `valid` - 1 if signature is valid, 0 otherwise

### 2. Age Proof (612 constraints)

Proves user is above a minimum age without revealing birthdate.

**Public Inputs:**
- `minAge` - Minimum age threshold (18)
- `currentTimestamp` - Current Unix timestamp

**Private Inputs:**
- `dateOfBirth` - User's birthdate (hidden)

**Output:**
- `isOldEnough` - 1 if age >= minAge

### 3. Nationality Proof (581 constraints)

Proves user is from a specific country without revealing other data.

**Public Inputs:**
- `expectedNationality` - Country code to prove

**Private Inputs:**
- `nationality` - Actual nationality (hidden)
- `passportData` - Other passport fields (hidden)

**Output:**
- `isMatch` - 1 if nationality matches

## 🏆 Governance

Zassport uses on-chain governance for protocol upgrades:

- **Reputation System**: Earn reputation by generating proofs and voting
- **Weighted Voting**: Vote power proportional to reputation
- **Proposal Types**: Add countries, change parameters, upgrade circuits
- **Time-Locked Execution**: 7-day voting period with quorum requirements

## 🔒 Security Considerations

### Privacy Guarantees

✅ **What's Hidden:**
- Full name
- Date of birth
- Passport number
- Photo
- All MRZ data

✅ **What's Revealed:**
- Age range (e.g., "over 18") - only when proving age
- Nationality - only when proving nationality
- Proof validity - always public

### Threat Model

- ❌ **Prevents**: Replay attacks (nullifiers), double-spending, data leakage
- ✅ **Trusts**: ICAO passport chip signatures, Groth16 trusted setup
- ⚠️ **Limitations**: Requires physical passport access, depends on passport chip security

## 📊 Performance

| Operation | Time | Gas Cost |
|-----------|------|----------|
| Age Proof Generation | ~2.5s | 0 (client-side) |
| Nationality Proof | ~2.3s | 0 (client-side) |
| On-Chain Verification | ~500ms | ~5,000 lamports |
| NFC Passport Scan | ~1-3s | 0 (offline) |

Circuit sizes:
- Passport Verifier: 474 constraints
- Age Proof: 612 constraints
- Nationality Proof: 581 constraints

## 🎥 Demo

[Video Demo Link - TBD]

### Demo Flow

1. 📱 User opens mobile app
2. 🔗 Connects Solana wallet
3. 📲 Scans passport with NFC
4. 🔐 Generates ZK proofs locally
5. ⛓️ Submits proofs to Solana
6. ✅ Identity verified on-chain
7. 🗳️ Participates in governance

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Workflow

```bash
# 1. Fork and clone
git clone https://github.com/yourusername/Zassport

# 2. Create feature branch
git checkout -b feature/amazing-feature

# 3. Make changes and test
anchor test
npm test

# 4. Commit with conventional commits
git commit -m "feat: add amazing feature"

# 5. Push and create PR
git push origin feature/amazing-feature
```

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Circom & SnarkJS** - ZK circuit framework
- **Solana & Anchor** - Blockchain infrastructure
- **ICAO 9303** - Passport standard specification
- **Network School** - Hackathon organizers
- **Zcash Community** - Privacy-first inspiration

## 📞 Contact

- **Team**: Zassport Team
- **GitHub**: [@Rahul-Prasad-07](https://github.com/Rahul-Prasad-07)
- **Deployed Contract**: `5sCDzoF1pzHisqrrpmfbDynCdjgBJX9FcmVBvJzBio2V` (Devnet)

---

**Built for Network School Zcash Hackathon 2025** 🏆

*Privacy is a human right. Zassport makes it a technical reality.*
