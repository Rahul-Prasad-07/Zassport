import { PublicKey, Ed25519Program, TransactionInstruction } from '@solana/web3.js';

/**
 * Build age attestation message matching on-chain format
 */
export function buildAgeMessage(
  programId: PublicKey,
  owner: PublicKey,
  identity: PublicKey,
  commitment: Buffer,
  nullifier: Buffer,
  minAge: bigint,
  timestamp: bigint
): Buffer {
  const parts = [
    Buffer.from('ZASSPORT|AGE|v1'),
    programId.toBuffer(),
    owner.toBuffer(),
    identity.toBuffer(),
    commitment,
    nullifier,
    u64le(minAge),
    i64le(timestamp),
  ];
  return Buffer.concat(parts);
}

/**
 * Build nationality attestation message matching on-chain format
 */
export function buildNatMessage(
  programId: PublicKey,
  owner: PublicKey,
  identity: PublicKey,
  commitment: Buffer,
  nullifier: Buffer,
  nationality: bigint,
  timestamp: bigint
): Buffer {
  const parts = [
    Buffer.from('ZASSPORT|NAT|v1'),
    programId.toBuffer(),
    owner.toBuffer(),
    identity.toBuffer(),
    commitment,
    nullifier,
    u64le(nationality),
    i64le(timestamp),
  ];
  return Buffer.concat(parts);
}

/**
 * Create Ed25519 pre-instruction for signature verification
 */
export function createEd25519Instruction(
  publicKey: Buffer,
  message: Buffer,
  signature: Buffer
): TransactionInstruction {
  return Ed25519Program.createInstructionWithPublicKey({
    publicKey,
    message,
    signature,
  });
}

/**
 * Helper to encode u64 as little-endian bytes
 */
function u64le(x: bigint): Buffer {
  const b = Buffer.alloc(8);
  b.writeBigUInt64LE(x);
  return b;
}

/**
 * Helper to encode i64 as little-endian bytes
 */
function i64le(x: bigint): Buffer {
  const b = Buffer.alloc(8);
  b.writeBigInt64LE(x);
  return b;
}

/**
 * Request age attestation from verifier service
 */
export async function requestAgeAttestation(
  verifierUrl: string,
  proof: any,
  publicInputs: string[],
  owner: string,
  identity: string,
  commitment: string,
  nullifier: string,
  minAge: number
): Promise<{
  minAge: number;
  timestamp: number;
  signature: string;
  message: string;
  verifierPublicKey: string;
}> {
  const response = await fetch(`${verifierUrl}/verify-age`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      proof,
      publicInputs,
      owner,
      identity,
      commitment,
      nullifier,
      minAge,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Attestation request failed');
  }

  const data = await response.json();
  return data.attestation;
}

/**
 * Request nationality attestation from verifier service
 */
export async function requestNationalityAttestation(
  verifierUrl: string,
  proof: any,
  publicInputs: string[],
  owner: string,
  identity: string,
  commitment: string,
  nullifier: string,
  allowedNationality: number
): Promise<{
  allowedNationality: number;
  timestamp: number;
  signature: string;
  message: string;
  verifierPublicKey: string;
}> {
  const response = await fetch(`${verifierUrl}/verify-nationality`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      proof,
      publicInputs,
      owner,
      identity,
      commitment,
      nullifier,
      allowedNationality,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Attestation request failed');
  }

  const data = await response.json();
  return data.attestation;
}
