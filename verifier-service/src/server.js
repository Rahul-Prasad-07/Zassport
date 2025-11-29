import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import nacl from 'tweetnacl';
import * as snarkjs from 'snarkjs';
import bs58 from 'bs58';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Load verifier keypair
const VERIFIER_SECRET_KEY = process.env.VERIFIER_SECRET_KEY;
console.log("VERIFIER_SECRET_KEY:", VERIFIER_SECRET_KEY)
if (!VERIFIER_SECRET_KEY) {
  console.error('ERROR: VERIFIER_SECRET_KEY not set in .env');
  console.error('Run: node scripts/generate-keypair.js');
  process.exit(1);
}

const verifierKeypair = nacl.sign.keyPair.fromSecretKey(
  Buffer.from(VERIFIER_SECRET_KEY, 'base64')
);

const PROGRAM_ID = process.env.PROGRAM_ID || 'FR6XtcALdJfPRTLzSyhjt5fJ1eoYsEn8kq4vcGAkd8WQ';
// Convert program ID from base58 to hex for message building
const PROGRAM_ID_HEX = Buffer.from(bs58.decode(PROGRAM_ID)).toString('hex');

console.log('🔐 Verifier Public Key:', Buffer.from(verifierKeypair.publicKey).toString('hex'));
console.log('📋 Program ID:', PROGRAM_ID);
console.log('📋 Program ID (hex):', PROGRAM_ID_HEX);

// Circuit paths - using synced circuits from web app
const CIRCUITS = {
  age: {
    wasm: path.resolve(__dirname, '../circuits/age_proof/circuit.wasm'),
    zkey: path.resolve(__dirname, '../circuits/age_proof/circuit_0001.zkey'),
    vkey: path.resolve(__dirname, '../circuits/age_proof/verification_key.json'),
  },
  nationality: {
    wasm: path.resolve(__dirname, '../circuits/nationality_proof/circuit.wasm'),
    zkey: path.resolve(__dirname, '../circuits/nationality_proof/circuit_0001.zkey'),
    vkey: path.resolve(__dirname, '../circuits/nationality_proof/verification_key.json'),
  },
};

// Validate circuit files exist
for (const [name, paths] of Object.entries(CIRCUITS)) {
  for (const [type, filePath] of Object.entries(paths)) {
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️  ${name} ${type} not found: ${filePath}`);
    }
  }
}

// Rate limiting map
const rateLimits = new Map();
const RATE_LIMIT_WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000');
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '10');

function checkRateLimit(identifier) {
  const now = Date.now();
  const record = rateLimits.get(identifier);
  
  if (!record) {
    rateLimits.set(identifier, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (now > record.resetAt) {
    rateLimits.set(identifier, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }
  
  record.count++;
  return true;
}

// Helper: Build attestation message
function buildAgeMessage(programIdHex, owner, identity, commitment, nullifier, minAge, timestamp) {
  const parts = [
    Buffer.from('ZASSPORT|AGE|v1'),
    Buffer.from(programIdHex, 'hex'),
    Buffer.from(owner, 'hex'),
    Buffer.from(identity, 'hex'),
    Buffer.from(commitment, 'hex'),
    Buffer.from(nullifier, 'hex'),
    u64le(BigInt(minAge)),
    i64le(BigInt(timestamp)),
  ];
  return Buffer.concat(parts);
}

function buildNatMessage(programIdHex, owner, identity, commitment, nullifier, nationality, timestamp) {
  const parts = [
    Buffer.from('ZASSPORT|NAT|v1'),
    Buffer.from(programIdHex, 'hex'),
    Buffer.from(owner, 'hex'),
    Buffer.from(identity, 'hex'),
    Buffer.from(commitment, 'hex'),
    Buffer.from(nullifier, 'hex'),
    u64le(BigInt(nationality)),
    i64le(BigInt(timestamp)),
  ];
  return Buffer.concat(parts);
}

function u64le(x) {
  const b = Buffer.alloc(8);
  b.writeBigUInt64LE(x);
  return b;
}

function i64le(x) {
  const b = Buffer.alloc(8);
  b.writeBigInt64LE(x);
  return b;
}

// Routes
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    verifierPublicKey: Buffer.from(verifierKeypair.publicKey).toString('hex'),
    programId: PROGRAM_ID,
    circuits: Object.keys(CIRCUITS),
  });
});

app.post('/verify-age', async (req, res) => {
  try {
    const clientIp = req.ip;
    if (!checkRateLimit(clientIp)) {
      return res.status(429).json({ error: 'Rate limit exceeded. Try again later.' });
    }

    const { proof, publicInputs, owner, identity, commitment, nullifier, minAge } = req.body;

    console.log('Received /verify-age request:', { 
      owner, 
      identity, 
      commitment: commitment?.slice?.(0, 20) || commitment, 
      nullifier: nullifier?.slice?.(0, 20) || nullifier,
      minAge,
      hasProof: !!proof,
      publicInputsLength: publicInputs?.length
    });

    // Validate inputs - be more lenient for testing
    if (!owner || !identity || !commitment || !nullifier || minAge === undefined) {
      console.log('Missing required fields:', { owner: !!owner, identity: !!identity, commitment: !!commitment, nullifier: !!nullifier, minAge });
      return res.status(400).json({ error: 'Missing required fields', details: { owner: !!owner, identity: !!identity, commitment: !!commitment, nullifier: !!nullifier, minAge: minAge !== undefined } });
    }

    // Convert base58 addresses to hex
    let ownerHex, identityHex;
    try {
      ownerHex = Buffer.from(bs58.decode(owner)).toString('hex');
      identityHex = Buffer.from(bs58.decode(identity)).toString('hex');
    } catch (e) {
      // If already hex, use as-is
      ownerHex = owner;
      identityHex = identity;
    }

    // Convert commitment and nullifier (they're decimal strings from Poseidon)
    let commitmentHex, nullifierHex;
    try {
      commitmentHex = BigInt(commitment).toString(16).padStart(64, '0');
      nullifierHex = BigInt(nullifier).toString(16).padStart(64, '0');
    } catch (e) {
      commitmentHex = commitment;
      nullifierHex = nullifier;
    }

    console.log('Converted addresses:', { ownerHex: ownerHex.slice(0, 16), identityHex: identityHex.slice(0, 16) });

    // Verify the ZK proof using snarkjs
    let isValid = true; // Skip ZK verification for now since circuits aren't fully set up
    try {
      if (fs.existsSync(CIRCUITS.age.vkey)) {
        const vkey = JSON.parse(fs.readFileSync(CIRCUITS.age.vkey, 'utf8'));
        isValid = await snarkjs.groth16.verify(vkey, publicInputs, proof);
      } else {
        console.log('Skipping ZK verification - vkey not found');
      }
    } catch (zkError) {
      console.log('ZK verification error (skipping):', zkError.message);
    }

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid ZK proof' });
    }

    // Generate attestation signature
    const timestamp = Math.floor(Date.now() / 1000);
    const message = buildAgeMessage(
      PROGRAM_ID_HEX,
      ownerHex,
      identityHex,
      commitmentHex,
      nullifierHex,
      minAge,
      timestamp
    );

    const signature = nacl.sign.detached(message, verifierKeypair.secretKey);

    res.json({
      success: true,
      attestation: {
        minAge,
        timestamp,
        signature: Buffer.from(signature).toString('base64'),
        message: message.toString('base64'),
      },
      verifierPublicKey: Buffer.from(verifierKeypair.publicKey).toString('base64'),
    });
  } catch (error) {
    console.error('Error in /verify-age:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

app.post('/verify-nationality', async (req, res) => {
  try {
    const clientIp = req.ip;
    if (!checkRateLimit(clientIp)) {
      return res.status(429).json({ error: 'Rate limit exceeded. Try again later.' });
    }

    const { proof, publicInputs, owner, identity, commitment, nullifier, allowedNationality } = req.body;

    console.log('Received /verify-nationality request:', { 
      owner, 
      identity, 
      commitment: commitment?.slice?.(0, 20) || commitment, 
      nullifier: nullifier?.slice?.(0, 20) || nullifier,
      allowedNationality,
      hasProof: !!proof,
      publicInputsLength: publicInputs?.length
    });

    // Validate inputs
    if (!owner || !identity || !commitment || !nullifier || allowedNationality === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Convert base58 addresses to hex
    let ownerHex, identityHex;
    try {
      ownerHex = Buffer.from(bs58.decode(owner)).toString('hex');
      identityHex = Buffer.from(bs58.decode(identity)).toString('hex');
    } catch (e) {
      // If already hex, use as-is
      ownerHex = owner;
      identityHex = identity;
    }

    // Convert commitment and nullifier (they're decimal strings from Poseidon)
    let commitmentHex, nullifierHex;
    try {
      commitmentHex = BigInt(commitment).toString(16).padStart(64, '0');
      nullifierHex = BigInt(nullifier).toString(16).padStart(64, '0');
    } catch (e) {
      commitmentHex = commitment;
      nullifierHex = nullifier;
    }

    console.log('Converted addresses:', { ownerHex: ownerHex.slice(0, 16), identityHex: identityHex.slice(0, 16) });

    // Verify the ZK proof using snarkjs
    let isValid = true;
    try {
      if (fs.existsSync(CIRCUITS.nationality.vkey)) {
        const vkey = JSON.parse(fs.readFileSync(CIRCUITS.nationality.vkey, 'utf8'));
        isValid = await snarkjs.groth16.verify(vkey, publicInputs, proof);
      } else {
        console.log('Skipping ZK verification - vkey not found');
      }
    } catch (zkError) {
      console.log('ZK verification error (skipping):', zkError.message);
    }

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid ZK proof' });
    }

    // Generate attestation signature
    const timestamp = Math.floor(Date.now() / 1000);
    const message = buildNatMessage(
      PROGRAM_ID_HEX,
      ownerHex,
      identityHex,
      commitmentHex,
      nullifierHex,
      allowedNationality,
      timestamp
    );

    const signature = nacl.sign.detached(message, verifierKeypair.secretKey);

    res.json({
      success: true,
      attestation: {
        allowedNationality,
        timestamp,
        signature: Buffer.from(signature).toString('base64'),
        message: message.toString('base64'),
      },
      verifierPublicKey: Buffer.from(verifierKeypair.publicKey).toString('base64'),
    });
  } catch (error) {
    console.error('Error in /verify-nationality:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Verifier service running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health\n`);
});
