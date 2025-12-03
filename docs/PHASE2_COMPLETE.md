# Zassport Phase 2 - Production Features

## Overview

Phase 2 adds advanced production-grade features to the Zassport ZK-Passport identity system:

1. **Real NFC Passport Reading** - PC/SC protocol, ICAO 9303, BAC authentication
2. **Multi-Verifier Quorum** - 3-of-5 decentralized attestation
3. **Revocation System** - On-chain revocation registry with Merkle tree
4. **Biometric Gating** - WebAuthn Face ID/Touch ID/Windows Hello
5. **Social Recovery** - Guardian-based identity recovery
6. **Cross-Chain Bridge** - Wormhole protocol for multi-chain attestations

---

## 1. NFC Passport Reading

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     NFC Reader Service                       │
├──────────────┬──────────────┬──────────────┬────────────────┤
│   types.ts   │ icao9303.ts  │sod-verify.ts │ nfc-reader.ts  │
├──────────────┼──────────────┼──────────────┼────────────────┤
│ APDU types   │ MRZ parsing  │ X.509 certs  │ PC/SC protocol │
│ Data groups  │ Check digits │ Hash verify  │ BAC auth       │
│ SOD types    │ Age calc     │ RSA/ECDSA    │ Secure session │
└──────────────┴──────────────┴──────────────┴────────────────┘
```

### Key Files

- `apps/web/src/lib/nfc/types.ts` - Type definitions for ICAO 9303
- `apps/web/src/lib/nfc/icao9303.ts` - MRZ parsing (TD1/TD2/TD3)
- `apps/web/src/lib/nfc/sod-verification.ts` - SOD & certificate verification
- `apps/web/src/lib/nfc/nfc-reader.ts` - PC/SC communication service
- `apps/web/src/components/NFCReaderUI.tsx` - User interface

### Usage

```typescript
import { parseMRZ, validateMRZ, generateBACKeys } from '@/lib/nfc';

// Parse MRZ from passport
const mrzLines = [
  'P<USASMITH<<JOHN<<<<<<<<<<<<<<<<<<<<<<<<<<<<',
  '1234567897USA9001015M3001019<<<<<<<<<<<<<<<6'
];

const mrz = parseMRZ(mrzLines);
console.log(mrz.fullName);  // "JOHN SMITH"
console.log(mrz.age);       // 34
console.log(mrz.isExpired); // false

// Generate BAC keys for secure reading
const bacKeys = await generateBACKeys(mrz);
```

---

## 2. Multi-Verifier Quorum (3-of-5)

### Solana Program Instructions

```rust
// Initialize multi-verifier config
initialize_multi_verifier(threshold: u8, verifiers: Vec<Pubkey>)

// Manage verifiers
add_verifier(new_verifier: Pubkey)
remove_verifier(verifier_to_remove: Pubkey)
update_threshold(new_threshold: u8)

// Submit attestation
submit_attestation(
    attestation_type: u8,  // 0=Age, 1=Nationality, 2=Validity, 3=Sanctions
    attested_value: u64,
    expiry: i64,
    signature: [u8; 64]
)

// Initialize quorum status
initialize_quorum_status()
```

### Account Structure

```rust
pub struct MultiVerifierConfig {
    pub authority: Pubkey,
    pub threshold: u8,              // e.g., 3
    pub total_verifiers: u8,        // e.g., 5
    pub verifiers: Vec<Pubkey>,
    pub created_at: i64,
    pub bump: u8,
}

pub struct QuorumStatus {
    pub identity: Pubkey,
    pub age_attestation_count: u8,
    pub age_threshold_met: bool,
    pub nationality_attestation_count: u8,
    pub nationality_threshold_met: bool,
    // ... more fields
}
```

---

## 3. Revocation System

### Instructions

```rust
// Admin functions
initialize_revocation_registry()
revoke_credential(reason: u8, new_merkle_root: [u8; 32], merkle_proof: [u8; 32])
update_merkle_root(new_root: [u8; 32])

// User function
self_revoke(reason: u8)
```

### Revocation Reasons

| Code | Reason |
|------|--------|
| 0 | Lost |
| 1 | Stolen |
| 2 | Expired |
| 3 | Compromised |
| 4 | Admin Action |

---

## 4. Biometric Gating (WebAuthn)

### API

```typescript
import {
  isWebAuthnSupported,
  isPlatformAuthenticatorAvailable,
  registerBiometric,
  authenticateWithBiometric,
  createBiometricAccessToken,
} from '@/lib/webauthn';

// Check support
const supported = isWebAuthnSupported();
const hasFaceID = await isPlatformAuthenticatorAvailable();

// Register biometric
const result = await registerBiometric(
  'john@example.com',
  'John Smith',
  'user-unique-id'
);

// Authenticate
const authResult = await authenticateWithBiometric();
if (authResult.success) {
  // Access granted
}

// Create access token for claim
const token = await createBiometricAccessToken('claim-id', 300); // 5 min
```

### Component

```tsx
import BiometricGate from '@/components/BiometricGate';

<BiometricGate
  onAuthenticated={() => setShowClaim(true)}
  onCancel={() => router.back()}
  title="Verify Your Identity"
  description="Use Face ID or Touch ID to access your claims."
/>
```

---

## 5. Social Recovery (3-of-5)

### Instructions

```rust
// Setup
initialize_social_recovery(
    threshold: u8,           // e.g., 3
    guardians: Vec<Pubkey>,  // e.g., 5 guardians
    recovery_delay: i64      // e.g., 86400 (24 hours)
)

// Manage guardians (owner only)
add_guardian(new_guardian: Pubkey)
remove_guardian(guardian_to_remove: Pubkey)

// Recovery process
approve_recovery(new_owner: Pubkey)      // Guardian calls
initiate_recovery(new_owner: Pubkey)     // After threshold approvals
execute_recovery()                        // After delay period
cancel_recovery()                         // Owner or guardian
```

### Recovery Flow

```
1. User loses access to wallet
2. Guardian 1 calls approve_recovery(new_wallet)
3. Guardian 2 calls approve_recovery(new_wallet)
4. Guardian 3 calls approve_recovery(new_wallet)
5. Any guardian calls initiate_recovery(new_wallet)
6. Wait 24 hours (recovery_delay)
7. Anyone can call execute_recovery()
8. Ownership transferred to new_wallet
```

---

## 6. Cross-Chain Bridge

### Supported Chains

| Chain | ID | Status |
|-------|-----|--------|
| Solana | 1 | ✅ Source |
| Ethereum | 2 | ✅ Target |
| BSC | 4 | ✅ Target |
| Polygon | 5 | ✅ Target |
| Avalanche | 6 | ✅ Target |
| Arbitrum | 23 | ✅ Target |
| Optimism | 24 | ✅ Target |

### Usage

```typescript
import { bridgeAttestation, CHAIN_IDS } from '@/lib/cross-chain';

const result = await bridgeAttestation(
  'age',                          // Attestation type
  '18',                           // Value
  CHAIN_IDS.ETHEREUM,            // Target chain
  publicKey.toString(),          // Signer
  proofHash                      // ZK proof
);

console.log(result.txId);         // Transaction ID
console.log(result.estimatedTime); // "~15 minutes"
```

### Component

```tsx
import CrossChainBridgeUI from '@/components/CrossChainBridgeUI';

<CrossChainBridgeUI
  onBridgeComplete={(txId, chain) => {
    console.log(`Bridged to chain ${chain}: ${txId}`);
  }}
/>
```

---

## File Structure

```
apps/web/src/
├── lib/
│   ├── nfc/
│   │   ├── types.ts           # NFC/ICAO types
│   │   ├── icao9303.ts        # MRZ parser
│   │   ├── sod-verification.ts # SOD/X.509
│   │   ├── nfc-reader.ts      # PC/SC service
│   │   └── index.ts           # Re-exports
│   ├── webauthn.ts            # Biometric auth
│   └── cross-chain.ts         # Wormhole bridge
├── components/
│   ├── NFCReaderUI.tsx        # NFC UI
│   ├── BiometricGate.tsx      # Biometric UI
│   └── CrossChainBridgeUI.tsx # Bridge UI

programs/zassport/src/
├── state/
│   ├── mod.rs
│   └── multi_verifier.rs      # New state accounts
├── instructions/
│   ├── mod.rs
│   ├── multi_verifier.rs      # Quorum instructions
│   ├── revocation.rs          # Revocation instructions
│   └── social_recovery.rs     # Recovery instructions
└── lib.rs                     # Program entry
```

---

## Security Considerations

### NFC Reading
- BAC keys derived from MRZ only
- Secure messaging with 3DES-CBC
- All data stays on device (no server transmission)

### Multi-Verifier
- Requires threshold (e.g., 3) of 5 verifiers
- Each verifier signs independently
- No single point of failure

### Revocation
- On-chain Merkle root for efficient checks
- Self-revoke available for emergency
- Admin revoke for compliance

### Biometrics
- WebAuthn standard (FIDO2)
- Private keys never leave device
- Phishing resistant

### Social Recovery
- 24-hour minimum delay
- Cancellable during delay
- Threshold-based (no single guardian can recover)

### Cross-Chain
- Wormhole guardian signatures
- VAA verification on target chain
- Source chain proof included

---

## Testing

### Unit Tests

```bash
# Rust tests
cd /Users/kyto/zk/Zassport
anchor test

# TypeScript tests
cd apps/web
npm test
```

### Integration Tests

```bash
# Start local validator
solana-test-validator

# Deploy program
anchor deploy

# Run integration suite
npm run test:integration
```

### E2E Tests

```bash
# Start services
npm run dev

# Run Cypress
npm run test:e2e
```

---

## Deployment Checklist

- [ ] Build Anchor program: `anchor build`
- [ ] Deploy to devnet: `anchor deploy --provider.cluster devnet`
- [ ] Update program ID in lib.rs
- [ ] Generate IDL: `anchor idl init`
- [ ] Build web app: `npm run build`
- [ ] Configure environment variables
- [ ] Deploy web app to Vercel/other

---

## API Reference

See individual file documentation for detailed API reference.
