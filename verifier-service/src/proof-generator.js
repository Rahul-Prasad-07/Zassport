// Server-side ZK Proof Generation for Mobile Clients
// Generates all Tier 1-2-3 proofs on the backend

import express from 'express';
import * as snarkjs from 'snarkjs';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Load circuit files
const CIRCUITS_PATH = path.join(__dirname, '../../circuits/build');

const circuits = {
  age: {
    wasm: path.join(CIRCUITS_PATH, 'age_proof/circuit.wasm'),
    zkey: path.join(CIRCUITS_PATH, 'age_proof/circuit_final.zkey'),
  },
  nationality: {
    wasm: path.join(CIRCUITS_PATH, 'nationality_proof/circuit.wasm'),
    zkey: path.join(CIRCUITS_PATH, 'nationality_proof/circuit_final.zkey'),
  },
  validity: {
    wasm: path.join(CIRCUITS_PATH, 'passport_verifier/circuit.wasm'),
    zkey: path.join(CIRCUITS_PATH, 'passport_verifier/circuit_final.zkey'),
  },
  sanctions: {
    wasm: path.join(CIRCUITS_PATH, 'sanctions/sanctions_negative.wasm'),
    zkey: path.join(CIRCUITS_PATH, 'sanctions/sanctions_final.zkey'),
  },
};

// Helper: Poseidon hash (using SHA256 as approximation)
function poseidonHash(inputs) {
  const data = inputs.map(i => BigInt(i).toString(16).padStart(64, '0')).join('');
  const hash = crypto.createHash('sha256').update(Buffer.from(data, 'hex')).digest('hex');
  return BigInt('0x' + hash.slice(0, 32)) % BigInt('21888242871839275222246405745257275088548364400416034343698204186575808495617');
}

// Generate commitment
function generateCommitment(passportData, salt = BigInt(Date.now())) {
  return poseidonHash([
    BigInt(passportData.dobTimestamp || 0),
    BigInt(passportData.nationalityCode || 356),
    salt,
  ]);
}

// Generate nullifier
function generateNullifier(commitment) {
  return poseidonHash([commitment]);
}

// Parse date to timestamp
function dateToTimestamp(dateStr) {
  // dateStr format: YYMMDD or YYYY-MM-DD
  let year, month, day;
  
  if (dateStr.includes('-')) {
    [year, month, day] = dateStr.split('-').map(Number);
  } else {
    year = 2000 + parseInt(dateStr.substring(0, 2));
    month = parseInt(dateStr.substring(2, 4));
    day = parseInt(dateStr.substring(4, 6));
  }
  
  return Math.floor(new Date(year, month - 1, day).getTime() / 1000);
}

// ISO 3166-1 numeric codes
const countryCodeMap = {
  'IND': 356, 'USA': 840, 'GBR': 826, 'CAN': 124,
  'AUS': 36, 'FRA': 250, 'DEU': 276, 'JPN': 392,
};

/**
 * POST /api/generate-proofs
 * Generate all ZK proofs server-side
 */
router.post('/generate-proofs', async (req, res) => {
  try {
    const { passportData, requirements } = req.body;

    console.log('[ProofGen] Generating proofs for passport:', passportData.documentNumber);

    // Prepare passport data
    const dobTimestamp = dateToTimestamp(passportData.dateOfBirth);
    const expTimestamp = dateToTimestamp(passportData.dateOfExpiry);
    const nationalityCode = countryCodeMap[passportData.nationality] || 356;
    const currentTimestamp = Math.floor(Date.now() / 1000);

    const commitment = generateCommitment({
      dobTimestamp,
      nationalityCode,
    });
    const nullifier = generateNullifier(commitment);

    // 1. Age Proof
    console.log('[ProofGen] Generating age proof...');
    const ageInput = {
      dob: dobTimestamp.toString(),
      currentTime: currentTimestamp.toString(),
      minAge: (requirements.minAge || 18).toString(),
      commitment: commitment.toString(),
      nullifier: nullifier.toString(),
    };

    const ageProofResult = await snarkjs.groth16.fullProve(
      ageInput,
      circuits.age.wasm,
      circuits.age.zkey
    );

    // 2. Nationality Proof
    console.log('[ProofGen] Generating nationality proof...');
    const nationalityInput = {
      nationality: nationalityCode.toString(),
      allowedCountries: (requirements.allowedCountries || [356, 840, 826]).map(c => c.toString()),
      commitment: commitment.toString(),
      nullifier: nullifier.toString(),
    };

    const nationalityProofResult = await snarkjs.groth16.fullProve(
      nationalityInput,
      circuits.nationality.wasm,
      circuits.nationality.zkey
    );

    // 3. Validity Proof (expiry check)
    console.log('[ProofGen] Generating validity proof...');
    const validityInput = {
      expiryDate: expTimestamp.toString(),
      currentTime: currentTimestamp.toString(),
      documentHash: passportData.documentHash || '0',
      commitment: commitment.toString(),
    };

    const validityProofResult = await snarkjs.groth16.fullProve(
      validityInput,
      circuits.validity.wasm,
      circuits.validity.zkey
    );

    // 4. Sanctions Proof (optional)
    let sanctionsProofResult = null;
    try {
      console.log('[ProofGen] Generating sanctions proof...');
      const sanctionsResponse = await fetch('http://localhost:3002/check-sanctions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentHash: passportData.documentHash }),
      });
      
      const sanctionsData = await sanctionsResponse.json();
      
      const sanctionsInput = {
        documentHash: passportData.documentHash || '0',
        merkleRoot: sanctionsData.merkleRoot,
        merklePath: sanctionsData.merklePath || [],
        isOnList: sanctionsData.isOnList ? '1' : '0',
      };

      sanctionsProofResult = await snarkjs.groth16.fullProve(
        sanctionsInput,
        circuits.sanctions.wasm,
        circuits.sanctions.zkey
      );
    } catch (e) {
      console.warn('[ProofGen] Sanctions proof skipped:', e.message);
    }

    // Format proofs for mobile client
    const proofs = {
      ageProof: {
        proof: ageProofResult.proof,
        publicSignals: ageProofResult.publicSignals,
        commitment: commitment.toString(),
        nullifier: nullifier.toString(),
      },
      nationalityProof: {
        proof: nationalityProofResult.proof,
        publicSignals: nationalityProofResult.publicSignals,
        commitment: commitment.toString(),
        nullifier: nullifier.toString(),
      },
      validityProof: {
        proof: validityProofResult.proof,
        publicSignals: validityProofResult.publicSignals,
        commitment: commitment.toString(),
        nullifier: nullifier.toString(),
      },
      sanctionsProof: sanctionsProofResult ? {
        proof: sanctionsProofResult.proof,
        publicSignals: sanctionsProofResult.publicSignals,
        commitment: commitment.toString(),
        nullifier: nullifier.toString(),
      } : null,
    };

    console.log('[ProofGen] All proofs generated successfully');
    res.json({ success: true, proofs });

  } catch (error) {
    console.error('[ProofGen] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
