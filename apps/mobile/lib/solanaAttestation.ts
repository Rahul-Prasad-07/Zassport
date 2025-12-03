// Solana On-Chain Attestation Service for React Native
// Writes attestation PDAs via Anchor program

import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  Keypair,
} from '@solana/web3.js';
import { Buffer } from '@craftzdog/react-native-buffer';
import { crypto } from '@/shims/crypto-polyfill';

// Program configuration
const PROGRAM_ID = new PublicKey(
  process.env.ZASSPORT_PROGRAM_ID || 'ZassprtxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxABC'
);

const RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';

export interface AttestationPDA {
  address: PublicKey;
  bump: number;
}

export interface OnChainAttestation {
  owner: PublicKey;
  commitment: string;
  nullifier: string;
  proofType: number; // 0: age, 1: nationality, 2: validity, 3: sanctions
  verified: boolean;
  timestamp: number;
  expiresAt: number;
}

/**
 * Derive PDA for attestation account
 */
export function deriveAttestationPDA(
  owner: PublicKey,
  commitment: string
): AttestationPDA {
  const [address, bump] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('attestation'),
      owner.toBuffer(),
      Buffer.from(commitment.slice(0, 32)),
    ],
    PROGRAM_ID
  );
  
  return { address, bump };
}

/**
 * Derive PDA for identity account
 */
export function deriveIdentityPDA(owner: PublicKey): AttestationPDA {
  const [address, bump] = PublicKey.findProgramAddressSync(
    [Buffer.from('identity'), owner.toBuffer()],
    PROGRAM_ID
  );
  
  return { address, bump };
}

/**
 * Create Solana connection
 */
export function createConnection(): Connection {
  return new Connection(RPC_URL, 'confirmed');
}

/**
 * Build attestation transaction
 * This creates the instruction data for the Anchor program
 */
export function buildAttestationInstruction(
  owner: PublicKey,
  commitment: string,
  nullifier: string,
  proofType: 'age' | 'nationality' | 'validity' | 'sanctions',
  proof: {
    pi_a: string[];
    pi_b: string[][];
    pi_c: string[];
  },
  publicSignals: string[]
): {
  accounts: { pubkey: PublicKey; isSigner: boolean; isWritable: boolean }[];
  data: Buffer;
} {
  const proofTypeMap = {
    age: 0,
    nationality: 1,
    validity: 2,
    sanctions: 3,
  };
  
  const { address: attestationPDA } = deriveAttestationPDA(owner, commitment);
  const { address: identityPDA } = deriveIdentityPDA(owner);
  
  // Encode instruction data (Anchor discriminator + args)
  // Discriminator for "create_attestation" = first 8 bytes of SHA256("global:create_attestation")
  const discriminator = Buffer.from(
    crypto.createHash('sha256')
      .update('global:create_attestation')
      .digest()
      .slice(0, 8)
  );
  
  // Encode commitment (32 bytes)
  const commitmentBytes = Buffer.alloc(32);
  const commitmentBN = BigInt(commitment);
  for (let i = 0; i < 32; i++) {
    commitmentBytes[31 - i] = Number((commitmentBN >> BigInt(i * 8)) & BigInt(0xff));
  }
  
  // Encode nullifier (32 bytes)
  const nullifierBytes = Buffer.alloc(32);
  const nullifierBN = BigInt(nullifier);
  for (let i = 0; i < 32; i++) {
    nullifierBytes[31 - i] = Number((nullifierBN >> BigInt(i * 8)) & BigInt(0xff));
  }
  
  // Encode proof type (1 byte)
  const proofTypeByte = Buffer.from([proofTypeMap[proofType]]);
  
  // Combine into instruction data
  const data = Buffer.concat([
    discriminator,
    commitmentBytes,
    nullifierBytes,
    proofTypeByte,
  ]);
  
  return {
    accounts: [
      { pubkey: owner, isSigner: true, isWritable: true },
      { pubkey: attestationPDA, isSigner: false, isWritable: true },
      { pubkey: identityPDA, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  };
}

/**
 * Create attestation transaction
 */
export async function createAttestationTransaction(
  connection: Connection,
  owner: PublicKey,
  commitment: string,
  nullifier: string,
  proofType: 'age' | 'nationality' | 'validity' | 'sanctions',
  proof: {
    pi_a: string[];
    pi_b: string[][];
    pi_c: string[];
  },
  publicSignals: string[]
): Promise<Transaction> {
  const { accounts, data } = buildAttestationInstruction(
    owner,
    commitment,
    nullifier,
    proofType,
    proof,
    publicSignals
  );
  
  const transaction = new Transaction();
  
  // Convert Buffer to Uint8Array for Solana SDK compatibility
  transaction.add({
    keys: accounts,
    programId: PROGRAM_ID,
    data: new Uint8Array(data) as any,
  });
  
  // Get recent blockhash
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.lastValidBlockHeight = lastValidBlockHeight;
  transaction.feePayer = owner;
  
  return transaction;
}

/**
 * Fetch attestation from chain
 */
export async function fetchAttestation(
  connection: Connection,
  attestationPDA: PublicKey
): Promise<OnChainAttestation | null> {
  try {
    const accountInfo = await connection.getAccountInfo(attestationPDA);
    
    if (!accountInfo) {
      return null;
    }
    
    // Decode account data (skip 8-byte discriminator)
    const data = accountInfo.data.slice(8);
    
    // Parse fields based on Anchor account structure
    const owner = new PublicKey(data.slice(0, 32));
    const commitment = BigInt('0x' + data.slice(32, 64).toString('hex')).toString();
    const nullifier = BigInt('0x' + data.slice(64, 96).toString('hex')).toString();
    const proofType = data[96];
    const verified = data[97] === 1;
    const timestamp = Number(data.readBigInt64LE(98));
    const expiresAt = Number(data.readBigInt64LE(106));
    
    return {
      owner,
      commitment,
      nullifier,
      proofType,
      verified,
      timestamp,
      expiresAt,
    };
  } catch (error) {
    console.error('[Solana] Failed to fetch attestation:', error);
    return null;
  }
}

/**
 * Check if attestation exists and is valid
 */
export async function isAttestationValid(
  connection: Connection,
  owner: PublicKey,
  commitment: string
): Promise<boolean> {
  const { address } = deriveAttestationPDA(owner, commitment);
  const attestation = await fetchAttestation(connection, address);
  
  if (!attestation) {
    return false;
  }
  
  const now = Math.floor(Date.now() / 1000);
  return attestation.verified && attestation.expiresAt > now;
}

/**
 * Get all attestations for an owner
 */
export async function getOwnerAttestations(
  connection: Connection,
  owner: PublicKey
): Promise<OnChainAttestation[]> {
  try {
    // Use getProgramAccounts with owner filter
    const accounts = await connection.getProgramAccounts(PROGRAM_ID, {
      filters: [
        {
          memcmp: {
            offset: 8, // After discriminator
            bytes: owner.toBase58(),
          },
        },
      ],
    });
    
    const attestations: OnChainAttestation[] = [];
    
    for (const { account } of accounts) {
      try {
        const data = account.data.slice(8);
        attestations.push({
          owner: new PublicKey(data.slice(0, 32)),
          commitment: BigInt('0x' + data.slice(32, 64).toString('hex')).toString(),
          nullifier: BigInt('0x' + data.slice(64, 96).toString('hex')).toString(),
          proofType: data[96],
          verified: data[97] === 1,
          timestamp: Number(data.readBigInt64LE(98)),
          expiresAt: Number(data.readBigInt64LE(106)),
        });
      } catch (e) {
        // Skip malformed accounts
      }
    }
    
    return attestations;
  } catch (error) {
    console.error('[Solana] Failed to get attestations:', error);
    return [];
  }
}
