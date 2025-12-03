# Passport Reader Service (Desktop Helper)

Local helper to enable NFC ePassport reads from the web app.

- Exposes `GET /health` to report status
- Exposes `POST /read` to initiate read with MRZ inputs (scaffold)
- Intended to use PC/SC (e.g., ACR122U/ACS) with ISO-DEP APDUs + BAC

Status: scaffolded. NFC + BAC implementation to be added using PC/SC + APDU stack.

## Quick start

```
cd services/passport-reader-service
npm install
npm run dev
```

Health check:

```
curl http://localhost:3010/health
```

## Next steps

- Integrate `nfc-pcsc` and implement BAC key derivation from MRZ + secure messaging
- Read DG1/DG11, SOD, and surface required fields to the browser
- Harden endpoint auth (loopback only) and add UI prompts on the web app