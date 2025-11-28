// Real ZK Proof Generation for Mobile (React Native compatible)
import { buildPoseidon } from 'circomlibjs';

// Dynamic import for snarkjs (React Native version)
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
 * Convert date string (YYYY-MM-DD) to timestamp
 */
export function dateToTimestamp(dateStr: string): number {
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
export async function generateAgeProof(
  passportData: {
    dateOfBirth: string;
    documentNumber: string;
    nationality: string;
  }
): Promise<{
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
  const maxAge = 120; // upper bound for circuit

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
    maxAge: maxAge.toString(),
    // Private inputs
    dateOfBirth: dobTimestamp.toString(),
    salt: salt.toString(),
  };

  try {
    const { proof, publicSignals } = await snarkjsLib.groth16.fullProve(
      proofInputs,
      './assets/circuits/age_proof/circuit.wasm',
      './assets/circuits/age_proof/trusted_setup_final.zkey'
    );

    return { proof, publicSignals, commitment, nullifier };
  } catch (error) {
    console.error('Error generating age proof:', error);
    throw new Error('Failed to generate age proof: ' + (error as Error).message);
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

  // Commitment = Poseidon(passportNumber, nationality, salt)
  const commitment = await generatePoseidonHash([
    passportNumBigInt,
    BigInt(nationalityCode),
    salt
  ]);
  // Nullifier = Poseidon(passportNumber)
  const nullifier = await generatePoseidonHash([
    passportNumBigInt
  ]);

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
      './assets/circuits/nationality_proof/circuit.wasm',
      './assets/circuits/nationality_proof/trusted_setup_final.zkey'
    );

    return { proof, publicSignals, commitment, nullifier };
  } catch (error) {
    console.error('Error generating nationality proof:', error);
    throw new Error('Failed to generate nationality proof: ' + (error as Error).message);
  }
}

/**
 * Generate Passport Proof
 */
export async function generatePassportProof(
  passportData: {
    dateOfBirth: string;
    documentNumber: string;
    nationality: string;
  }
): Promise<{
  proof: any;
  publicSignals: string[];
  commitment: string;
  nullifier: string;
}> {
  const snarkjsLib = await getSnarkjs();

  // Generate random salt
  const salt = BigInt(Math.floor(Math.random() * 1000000000));

  // Convert data to bigints
  const dobTimestamp = dateToTimestamp(passportData.dateOfBirth);
  const docNumBigInt = BigInt(
    Array.from(passportData.documentNumber)
      .reduce((acc, char) => acc + char.charCodeAt(0), 0)
  );

  // Generate commitment and nullifier
  const commitment = await generateCommitment(
    BigInt(dobTimestamp),
    docNumBigInt,
    salt
  );
  const nullifier = await generateNullifier(commitment);

  const proofInputs = {
    commitment,
    nullifier,
  };

  try {
    const { proof, publicSignals } = await snarkjsLib.groth16.fullProve(
      proofInputs,
      './assets/circuits/passport_verifier/circuit.wasm',
      './assets/circuits/passport_verifier/trusted_setup_final.zkey'
    );

    return { proof, publicSignals, commitment, nullifier };
  } catch (error) {
    console.error('Error generating passport proof:', error);
    throw new Error('Failed to generate passport proof: ' + (error as Error).message);
  }
}

/**
 * Convert nationality string to ISO 3166-1 numeric code
 */
function getNationalityCode(nationality: string): number {
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
}export function formatProofForChain(proof: any, publicSignals: any) {
  return {
    proof: proof,
    publicSignals: publicSignals,
  };
}