// ZK Proof Generation and Verification Utilities (Browser-Compatible)
import { buildPoseidon } from 'circomlibjs';

// Dynamic import for snarkjs (browser version)
let snarkjs: any = null;

async function getSnarkjs() {
  if (!snarkjs) {
    //@ts-ignore: Missing types for 'snarkjs' package in this environment
    snarkjs = await import('snarkjs');
  }
  return snarkjs;
}

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
  documentNumber: bigint,
  salt: bigint
): Promise<string> {
  return generatePoseidonHash([dateOfBirth, documentNumber, salt]);
}

/**
 * Generate nullifier from commitment
 */
export async function generateNullifier(commitment: string): Promise<string> {
  return generatePoseidonHash([BigInt(commitment)]);
}

/**
 * Convert decimal string BigInt to 32-byte big-endian Buffer
 */
export function bigintTo32BytesBE(decimalStr: string): Uint8Array {
  let x = BigInt(decimalStr);
  const bytes = new Uint8Array(32);
  for (let i = 31; i >= 0; i--) {
    bytes[i] = Number(x & BigInt(0xff));
    x >>= BigInt(8);
  }
  return bytes;
}

/**
 * Convert date string (YYYY-MM-DD) to timestamp
 */
export function dateToTimestamp(dateStr: string): number {
  // Support both ISO (YYYY-MM-DD) and YYMMDD formats
  if (/^\d{6}$/.test(dateStr)) {
    const year = parseInt(dateStr.substring(0, 2));
    const month = parseInt(dateStr.substring(2, 4));
    const day = parseInt(dateStr.substring(4, 6));
    const fullYear = year >= 50 ? 1900 + year : 2000 + year;
    const d = new Date(fullYear, month - 1, day);
    return Math.floor(d.getTime() / 1000);
  }
  return Math.floor(new Date(dateStr).getTime() / 1000);
}

/**
 * Calculate age from date of birth
 */
export function calculateAge(dateOfBirth: string): number {
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

/**
 * Generate Age Proof (18+)
 */
export async function generateAgeProof(passportData: {
  dateOfBirth: string;
  documentNumber: string;
  nationality: string;
}): Promise<{
  proof: any;
  publicSignals: string[];
  commitment: string;
  nullifier: string;
}> {
  const snarkjsLib = await getSnarkjs();
  
  // Generate random salt
  const salt = BigInt(Math.floor(Math.random() * 1000000000));
  
  // Convert date to timestamp
  const dobTimestamp = dateToTimestamp(passportData.dateOfBirth);
  const currentTimestamp = Math.floor(Date.now() / 1000);
  
  // Calculate age
  const age = calculateAge(passportData.dateOfBirth);
  const minAge = 18;
  
  // Age circuit commitment = Poseidon(dateOfBirth, salt)
  const commitment = await generatePoseidonHash([
    BigInt(dobTimestamp),
    salt
  ]);
  // Nullifier = Poseidon(commitment)
  const nullifier = await generatePoseidonHash([
    BigInt(commitment)
  ]);

  const proofInputs = {
    // Public inputs
    commitment,
    nullifier,
    currentTimestamp: currentTimestamp.toString(),
    minAge: minAge.toString(),
    maxAge: '120', // Maximum age
    // Private inputs
    dateOfBirth: dobTimestamp.toString(),
    salt: salt.toString(),
  };

  try {
    const { proof, publicSignals } = await snarkjsLib.groth16.fullProve(
      proofInputs,
      '/circuits/age_proof/circuit.wasm',
      '/circuits/age_proof/trusted_setup_final.zkey'
    );

    return { proof, publicSignals, commitment, nullifier };
  } catch (error) {
    console.error('Error generating age proof:', error);
    throw new Error('Failed to generate age proof: ' + (error as Error).message);
  }
}

/**
 * Verify Age Proof
 */
export async function verifyAgeProof(
  proof: any,
  publicSignals: string[]
): Promise<boolean> {
  const snarkjsLib = await getSnarkjs();
  
  try {
    const vkeyResponse = await fetch('/circuits/age_proof/verification_key.json');
    const vkey = await vkeyResponse.json();
    
    return await snarkjsLib.groth16.verify(vkey, publicSignals, proof);
  } catch (error) {
    console.error('Error verifying age proof:', error);
    return false;
  }
}

/**
 * Generate Nationality Proof
 */
export async function generateNationalityProof(
  passportData: {
    dateOfBirth: string;
    documentNumber: string;
    nationality: string;
  },
  targetNationality: string
): Promise<{
  proof: any;
  publicSignals: string[];
  commitment: string;
  nullifier: string;
}> {
  const snarkjsLib = await getSnarkjs();
  
  // Generate random salt
  const salt = BigInt(Math.floor(Math.random() * 1000000000));
  
  // Convert passport number to bigint
  const passportNumBigInt = BigInt(
    Array.from(passportData.documentNumber)
      .reduce((acc, char) => acc + char.charCodeAt(0), 0)
  );
  
  // Convert nationality to country code (ISO 3166-1 numeric)
  const nationalityCode = getNationalityCode(passportData.nationality);
  const targetCode = getNationalityCode(targetNationality);
  
  // Generate commitment: Poseidon(passportNumber, nationality, salt)
  const commitment = await generatePoseidonHash([passportNumBigInt, BigInt(nationalityCode), salt]);
  
  // Generate nullifier: Poseidon(passportNumber)
  const nullifier = await generatePoseidonHash([passportNumBigInt]);

  const proofInputs = {
    // Public inputs
    commitment,
    nullifier,
    allowedNationality: targetCode.toString(),
    // Private inputs
    passportNumber: passportNumBigInt.toString(),
    nationality: nationalityCode.toString(),
    salt: salt.toString(),
  };

  try {
    const { proof, publicSignals } = await snarkjsLib.groth16.fullProve(
      proofInputs,
      '/circuits/nationality_proof/circuit.wasm',
      '/circuits/nationality_proof/trusted_setup_final.zkey'
    );

    return { proof, publicSignals, commitment, nullifier };
  } catch (error) {
    console.error('Error generating nationality proof:', error);
    throw new Error('Failed to generate nationality proof: ' + (error as Error).message);
  }
}

/**
 * Verify Nationality Proof
 */
export async function verifyNationalityProof(
  proof: any,
  publicSignals: string[]
): Promise<boolean> {
  const snarkjsLib = await getSnarkjs();
  
  try {
    const vkeyResponse = await fetch('/circuits/nationality_proof/verification_key.json');
    const vkey = await vkeyResponse.json();
    
    return await snarkjsLib.groth16.verify(vkey, publicSignals, proof);
  } catch (error) {
    console.error('Error verifying nationality proof:', error);
    return false;
  }
}

/**
 * Convert nationality string to ISO 3166-1 numeric code
 */
export function getNationalityCode(nationality: string): number {
  const codes: { [key: string]: number } = {
    'USA': 840,
    'GBR': 826,
    'CAN': 124,
    'AUS': 36,
    'DEU': 276,
    'FRA': 250,
    'JPN': 392,
    'CHN': 156,
    'IND': 356,
    'BRA': 76,
    'MEX': 484,
    'ESP': 724,
    'ITA': 380,
    'NLD': 528,
    'SWE': 752,
    'NOR': 578,
    'DNK': 208,
    'FIN': 246,
    'POL': 616,
    'CHE': 756,
  };
  
  return codes[nationality.toUpperCase()] || 0;
}

/**
 * Format proof for on-chain submission
 */
export function formatProofForChain(proof: any): {
  a: [string, string];
  b: [[string, string], [string, string]];
  c: [string, string];
} {
  return {
    a: [proof.pi_a[0], proof.pi_a[1]],
    b: [
      [proof.pi_b[0][1], proof.pi_b[0][0]],
      [proof.pi_b[1][1], proof.pi_b[1][0]],
    ],
    c: [proof.pi_c[0], proof.pi_c[1]],
  };
}

/**
 * Export proof to JSON string
 */
export function exportProof(proof: any, publicSignals: string[]): string {
  return JSON.stringify({
    proof,
    publicSignals,
    timestamp: Date.now(),
  }, null, 2);
}

/**
 * Import proof from JSON string
 */
export function importProof(jsonStr: string): {
  proof: any;
  publicSignals: string[];
  timestamp: number;
} {
  return JSON.parse(jsonStr);
}
