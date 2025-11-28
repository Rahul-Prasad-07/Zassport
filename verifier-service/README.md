# Zassport Verifier Service

Off-chain ZK proof verification and attestation signing service for Zassport.

## Overview

The verifier service:
1. Receives ZK proofs from clients
2. Verifies proofs using snarkjs
3. Signs attestations with Ed25519 keypair
4. Returns signatures for on-chain submission

## Setup

### 1. Generate Keypair

```bash
node scripts/generate-keypair.js
```

This generates:
- Public key (hex) - use to initialize VerifierConfig on-chain
- Secret key (base64) - add to `.env` as `VERIFIER_SECRET_KEY`

**⚠️ Keep secret key secure! Never commit to git.**

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:
```env
VERIFIER_SECRET_KEY=<base64-secret-from-step-1>
PROGRAM_ID=FR6XtcALdJfPRTLzSyhjt5fJ1eoYsEn8kq4vcGAkd8WQ
PORT=3000
```

### 3. Install & Run

```bash
npm install
npm start
```

Service will start on `http://localhost:3000`

## API Endpoints

### `POST /verify-age`

Verify age proof and issue attestation.

**Request:**
```json
{
  "proof": {
    "pi_a": ["0x...", "0x...", "1"],
    "pi_b": [["0x...", "0x..."], ["0x...", "0x..."], ["1", "0"]],
    "pi_c": ["0x...", "0x...", "1"]
  },
  "publicInputs": [
    "0x0b346ea3935a738c...",  // commitment
    "0x238fcd015aec9974...",  // nullifier
    "0x0000000065a1e500",      // timestamp
    "0x0000000000000012",      // minAge (18)
    "0x000000000000003c"       // maxAge (60)
  ],
  "owner": "9Bs5TCnQcbr85Qsi6NuJr6yXgiCR8QbYr2nSt2GNjPeY",
  "identity": "FQXwAJk...",
  "commitment": "0b346ea3935a738c...",
  "nullifier": "238fcd015aec9974...",
  "minAge": 18
}
```

**Response:**
```json
{
  "success": true,
  "attestation": {
    "minAge": 18,
    "timestamp": 1732800000,
    "signature": "base64-ed25519-signature...",
    "message": "base64-attestation-message..."
  },
  "verifierPublicKey": "base64-verifier-pubkey..."
}
```

### `POST /verify-nationality`

Verify nationality proof and issue attestation.

**Request:**
```json
{
  "proof": { /* snarkjs proof */ },
  "publicInputs": [
    "0x0b346ea3935a738c...",  // commitment
    "0x238fcd015aec9974...",  // nullifier
    "0x0000000000000164"       // nationality (356 = India)
  ],
  "owner": "9Bs5...",
  "identity": "FQXw...",
  "commitment": "0b34...",
  "nullifier": "238f...",
  "allowedNationality": 356
}
```

**Response:**
```json
{
  "success": true,
  "attestation": {
    "allowedNationality": 356,
    "timestamp": 1732800000,
    "signature": "base64...",
    "message": "base64..."
  },
  "verifierPublicKey": "base64..."
}
```

### `GET /health`

Health check.

**Response:**
```json
{
  "status": "ok",
  "verifierPublicKey": "hex-pubkey...",
  "programId": "FR6XtcALdJfPRTLzSyhjt5fJ1eoYsEn8kq4vcGAkd8WQ",
  "circuits": ["age", "nationality"]
}
```

## Message Format

### Age Attestation
```
"ZASSPORT|AGE|v1" ||
programId (32 bytes) ||
owner (32 bytes) ||
identity (32 bytes) ||
commitment (32 bytes) ||
nullifier (32 bytes) ||
minAge (u64 LE, 8 bytes) ||
timestamp (i64 LE, 8 bytes)
```

### Nationality Attestation
```
"ZASSPORT|NAT|v1" ||
programId (32 bytes) ||
owner (32 bytes) ||
identity (32 bytes) ||
commitment (32 bytes) ||
nullifier (32 bytes) ||
nationality (u64 LE, 8 bytes) ||
timestamp (i64 LE, 8 bytes)
```

## Security

### Rate Limiting
- Default: 10 requests per 60 seconds per IP
- Configure via `RATE_LIMIT_WINDOW_MS` and `RATE_LIMIT_MAX_REQUESTS`

### Signature Security
- Ed25519 signatures over domain-separated messages
- Includes programId to prevent cross-program replay
- Timestamp checked ±10 minutes on-chain

### Best Practices
- Run behind reverse proxy (nginx/Caddy)
- Enable HTTPS in production
- Store secret key in KMS/HSM for production
- Monitor for unusual request patterns
- Log failed verification attempts

## Deployment

### Production Checklist
- [ ] Generate production keypair securely
- [ ] Store secret key in secure vault (AWS Secrets Manager, etc.)
- [ ] Configure CORS for your frontend domain
- [ ] Enable rate limiting
- [ ] Set up monitoring (Datadog, New Relic, etc.)
- [ ] Add request logging (exclude sensitive data)
- [ ] Deploy behind load balancer
- [ ] Set up auto-scaling

### Example: Deploy to Railway

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Create project
railway init

# Add environment variables
railway variables set VERIFIER_SECRET_KEY=...
railway variables set PROGRAM_ID=...

# Deploy
railway up
```

## Testing

```bash
# Start service
npm start

# In another terminal, test endpoints
curl http://localhost:3000/health

# Test with sample proof
curl -X POST http://localhost:3000/verify-age \
  -H "Content-Type: application/json" \
  -d @sample-age-proof.json
```

## Troubleshooting

### "Circuit files not found"
Ensure circuit paths in `.env` point to compiled circuits:
```env
AGE_PROOF_ZKEY=../circuits/age_proof/build/circuit_0001.zkey
AGE_PROOF_WASM=../circuits/age_proof/build/circuit_js/circuit.wasm
AGE_PROOF_VKEY=../circuits/age_proof/build/verification_key.json
```

### "Invalid proof"
- Verify public inputs match circuit outputs
- Check proof format (snarkjs JSON format required)
- Ensure circuit compilation matches zkey/wasm

### "Rate limit exceeded"
Increase limits or implement per-user authentication:
```env
RATE_LIMIT_WINDOW_MS=120000  # 2 minutes
RATE_LIMIT_MAX_REQUESTS=20
```

## License

ISC
