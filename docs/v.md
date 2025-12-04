Generating Ed25519 keypair for verifier...

=== Verifier Keypair Generated ===

Public Key (Base64): d7wCjRjjOYSR5kgVgvY+DjChy+646RE4Szd3gGBjLAI=
Public Key (Hex):    77bc028d18e3398491e6481582f63e0e30a1cbeeb8e911384b37778060632c02

Secret Key (Base64): Z+nsPQMBTy47OQS4S4PVa01iVDSDi4NjmxRDGnw151x3vAKNGOM5hJHmSBWC9j4OMKHL7rjpEThLN3eAYGMsAg==

=== Setup Instructions ===

1. Copy this to verifier-service/.env:
   VERIFIER_SECRET_KEY=Z+nsPQMBTy47OQS4S4PVa01iVDSDi4NjmxRDGnw151x3vAKNGOM5hJHmSBWC9j4OMKHL7rjpEThLN3eAYGMsAg==

2. Use this public key to initialize VerifierConfig on-chain:
   Public Key: 77bc028d18e3398491e6481582f63e0e30a1cbeeb8e911384b37778060632c02

3. Keep the secret key secure and never commit it to git!

Keypair saved to: verifier-keypair.json
WARNING: Delete this file after copying keys to secure storage!

kyto@Rahuls-MacBook-Pro verifier-service % 