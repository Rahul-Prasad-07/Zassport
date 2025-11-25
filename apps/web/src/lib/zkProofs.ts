// ZK Proof Generation and Verification Utilities
import { buildPoseidon } from 'circomlibjs';
const snarkjs = require('snarkjs');
const fs = require('fs');
const path = require('path');

/**
 * Generate Poseidon hash (commitment or nullifier)
 */
export async function generatePoseidonHash(inputs: bigint[]): Promise<string> {
  const poseidon = await buildPoseidon();
  const hash = poseidon(inputs);
  return poseidon.F.toString(hash);
}

/**
 * Generate commitment from passport data
 */
export async function generateCommitment(
  dateOfBirth: bigint,
  salt: bigint
): Promise<string> {
  return generatePoseidonHash([dateOfBirth, salt]);
}

/**
 * Generate nullifier from commitment
 */
export async function generateNullifier(commitment: string): Promise<string> {
  return generatePoseidonHash([BigInt(commitment)]);
}

/**
 * Generate Age Proof
 */
export async function generateAgeProof(inputs: {
  dateOfBirth: string;
  salt: string;
  currentTimestamp: string;
  minAge: string;
  maxAge: string;
}): Promise<{
  proof: any;
  publicSignals: any;
}> {
  const circuitPath = path.join(
    process.cwd(),
    'circuits/age_proof/build/circuit_js/circuit.wasm'
  );
  const zkeyPath = path.join(
    process.cwd(),
    'circuits/age_proof/build/circuit_final.zkey'
  );

  // Calculate commitment and nullifier
  const commitment = await generateCommitment(
    BigInt(inputs.dateOfBirth),
    BigInt(inputs.salt)
  );
  const nullifier = await generateNullifier(commitment);

  const proofInputs = {
    dateOfBirth: inputs.dateOfBirth,
    salt: inputs.salt,
    commitment,
    nullifier,
    currentTimestamp: inputs.currentTimestamp,
    minAge: inputs.minAge,
    maxAge: inputs.maxAge,
  };

  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    proofInputs,
    circuitPath,
    zkeyPath
  );

  return { proof, publicSignals };
}

/**
 * Verify Age Proof
 */
export async function verifyAgeProof(
  proof: any,
  publicSignals: any
): Promise<boolean> {
  const vkeyPath = path.join(
    process.cwd(),
    'circuits/age_proof/build/verification_key.json'
  );
  const vkey = JSON.parse(fs.readFileSync(vkeyPath, 'utf-8'));

  return await snarkjs.groth16.verify(vkey, publicSignals, proof);
}

/**
 * Generate Nationality Proof
 */
export async function generateNationalityProof(inputs: {
  nationality: string;
  salt: string;
  allowedNationality: string;
}): Promise<{
  proof: any;
  publicSignals: any;
}> {
  const circuitPath = path.join(
    process.cwd(),
    'circuits/nationality_proof/build/circuit_js/circuit.wasm'
  );
  const zkeyPath = path.join(
    process.cwd(),
    'circuits/nationality_proof/build/circuit_final.zkey'
  );

  const commitment = await generateCommitment(
    BigInt(inputs.nationality),
    BigInt(inputs.salt)
  );
  const nullifier = await generateNullifier(commitment);

  const proofInputs = {
    nationality: inputs.nationality,
    salt: inputs.salt,
    commitment,
    nullifier,
    allowedNationality: inputs.allowedNationality,
  };

  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    proofInputs,
    circuitPath,
    zkeyPath
  );

  return { proof, publicSignals };
}

/**
 * Verify Nationality Proof
 */
export async function verifyNationalityProof(
  proof: any,
  publicSignals: any
): Promise<boolean> {
  const vkeyPath = path.join(
    process.cwd(),
    'circuits/nationality_proof/build/verification_key.json'
  );
  const vkey = JSON.parse(fs.readFileSync(vkeyPath, 'utf-8'));

  return await snarkjs.groth16.verify(vkey, publicSignals, proof);
}

/**
 * Generate Passport Verifier Proof
 */
export async function generatePassportProof(inputs: {
  passportNumber: string;
  dateOfBirth: string;
  expiryDate: string;
  signature: string[];
  salt: string;
}): Promise<{
  proof: any;
  publicSignals: any;
}> {
  const circuitPath = path.join(
    process.cwd(),
    'circuits/passport_verifier/build/circuit_js/circuit.wasm'
  );
  const zkeyPath = path.join(
    process.cwd(),
    'circuits/passport_verifier/build/circuit_final.zkey'
  );

  const commitment = await generateCommitment(
    BigInt(inputs.dateOfBirth),
    BigInt(inputs.salt)
  );
  const nullifier = await generateNullifier(commitment);

  const proofInputs = {
    passportNumber: inputs.passportNumber,
    dateOfBirth: inputs.dateOfBirth,
    expiryDate: inputs.expiryDate,
    signature: inputs.signature,
    salt: inputs.salt,
    commitment,
    nullifier,
  };

  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    proofInputs,
    circuitPath,
    zkeyPath
  );

  return { proof, publicSignals };
}

/**
 * Verify Passport Proof
 */
export async function verifyPassportProof(
  proof: any,
  publicSignals: any
): Promise<boolean> {
  const vkeyPath = path.join(
    process.cwd(),
    'circuits/passport_verifier/build/verification_key.json'
  );
  const vkey = JSON.parse(fs.readFileSync(vkeyPath, 'utf-8'));

  return await snarkjs.groth16.verify(vkey, publicSignals, proof);
}

/**
 * Convert proof to bytes for Solana
 */
export function proofToBytes(proof: any): Uint8Array {
  // Serialize proof to bytes for on-chain verification
  const proofStr = JSON.stringify(proof);
  return new TextEncoder().encode(proofStr);
}

/**
 * Convert public signals to proper format
 */
export function formatPublicSignals(signals: any[]): string[] {
  return signals.map((s) => s.toString());
}

/**
 * Parse date to Unix timestamp
 */
export function dateToTimestamp(date: Date): bigint {
  return BigInt(Math.floor(date.getTime() / 1000));
}

/**
 * Calculate age from birth date
 */
export function calculateAge(birthDate: Date, currentDate: Date = new Date()): number {
  const diff = currentDate.getTime() - birthDate.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}
