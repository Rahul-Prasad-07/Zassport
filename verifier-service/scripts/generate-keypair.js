import nacl from 'tweetnacl';
import fs from 'fs';

console.log('Generating Ed25519 keypair for verifier...\n');

const keypair = nacl.sign.keyPair();

const secretKeyBase64 = Buffer.from(keypair.secretKey).toString('base64');
const publicKeyBase64 = Buffer.from(keypair.publicKey).toString('base64');
const publicKeyHex = Buffer.from(keypair.publicKey).toString('hex');

console.log('=== Verifier Keypair Generated ===\n');
console.log('Public Key (Base64):', publicKeyBase64);
console.log('Public Key (Hex):   ', publicKeyHex);
console.log('\nSecret Key (Base64):', secretKeyBase64);

console.log('\n=== Setup Instructions ===\n');
console.log('1. Copy this to verifier-service/.env:');
console.log(`   VERIFIER_SECRET_KEY=${secretKeyBase64}\n`);
console.log('2. Use this public key to initialize VerifierConfig on-chain:');
console.log(`   Public Key: ${publicKeyHex}\n`);
console.log('3. Keep the secret key secure and never commit it to git!\n');

// Optionally save to a file
const output = {
  publicKey: {
    base64: publicKeyBase64,
    hex: publicKeyHex,
  },
  secretKey: {
    base64: secretKeyBase64,
  },
  timestamp: new Date().toISOString(),
};

fs.writeFileSync('verifier-keypair.json', JSON.stringify(output, null, 2));
console.log('Keypair saved to: verifier-keypair.json');
console.log('WARNING: Delete this file after copying keys to secure storage!\n');
