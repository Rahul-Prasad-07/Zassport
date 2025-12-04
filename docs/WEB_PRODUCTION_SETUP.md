# Web Production Setup

This guide covers running the Zassport web app with real ZK proofs and Solana attestations, using your desktop browser.

## Prerequisites

- Node.js 18+
- Chrome/Brave/Chromium-based browser
- Solana wallet (Phantom or Solflare) on Devnet
- Backend services:
  - verifier-service (ZK attestation and server-side helpers)
  - sanctions-oracle (optional)

## 1) Install dependencies

```
# from repo root
npm install
```

## 2) Start backend services

```
# Terminal A: verifier-service
cd services/verifier-service
npm install
npm start

# Terminal B: sanctions-oracle (optional)
cd services/sanctions-oracle
npm install
npm start
```

Note the verifier URL. Default: `http://localhost:3000`.

## 3) Configure web app

Set the verifier URL via environment variables (optional):

```
# apps/web/.env.local
NEXT_PUBLIC_VERIFIER_URL=http://localhost:3000
NEXT_PUBLIC_SANCTIONS_URL=http://localhost:3002
```

## 4) Run the web app

```
cd apps/web
npm install
npm run dev
```

Open the URL shown (typically `http://localhost:3000`).

## 5) Web usage

- Connect your Solana wallet (Devnet)
- Register your ZK identity (stores only commitments on-chain)
- Generate proofs (Age 18+, Nationality) in the browser
- Submit proofs for attestation via verifier-service
- View transaction on Solana Devnet explorer

## NFC on Web (Desktop Helper)

Modern browsers cannot directly access ISO-DEP for ePassports. Use a loopback desktop helper:

```
# optional: local NFC reader helper scaffold
cd services/passport-reader-service
npm install
npm run dev
```

The web app will detect it on `http://localhost:3010/health`. Implement PC/SC + BAC to read DGs and feed parsed data into the web UI.

## Troubleshooting

- Circuits fail to load: ensure `apps/web/public/circuits/*` exist and your browser allows large WASM files.
- Verifier errors: confirm `NEXT_PUBLIC_VERIFIER_URL` is correct and service is running.
- Wallet errors: ensure Phantom/Solflare is installed and set to Devnet.
