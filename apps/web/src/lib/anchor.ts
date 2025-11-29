import { Program, AnchorProvider, Idl } from '@coral-xyz/anchor';
import { Connection, PublicKey } from '@solana/web3.js';
import { AnchorWallet } from '@solana/wallet-adapter-react';
import idl from './zassport.json';

// Deployed program ID on devnet
export const PROGRAM_ID = new PublicKey('FR6XtcALdJfPRTLzSyhjt5fJ1eoYsEn8kq4vcGAkd8WQ');

// Create program instance
export function getProgram(connection: Connection, wallet: AnchorWallet) {
  try {
    const provider = new AnchorProvider(connection, wallet, {
      commitment: 'confirmed',
      preflightCommitment: 'confirmed',
    });
    
    const program = new Program(idl as Idl, provider);
    console.log('Program created with ID:', program.programId.toString());
    console.log('Provider endpoint:', provider.connection.rpcEndpoint);
    return program;
  } catch (error) {
    console.error('Failed to create program:', error);
    throw error;
  }
}

// Helper to get identity PDA
export function getIdentityPDA(authority: PublicKey, programId: PublicKey = PROGRAM_ID) {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('identity'), authority.toBuffer()],
    programId
  );
  return pda;
}

// Helper to get proposal PDA
export function getProposalPDA(proposalId: number, programId: PublicKey = PROGRAM_ID) {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('proposal'), Buffer.from(proposalId.toString())],
    programId
  );
  return pda;
}

// Helper to get nullifier registry PDA
export function getNullifierRegistryPDA(programId: PublicKey = PROGRAM_ID) {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('nullifier_registry')],
    programId
  );
  return pda;
}

// Helper to get verifier config PDA
export function getVerifierConfigPDA(programId: PublicKey = PROGRAM_ID) {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('verifier_config')],
    programId
  );
  return pda;
}

// Instructions sysvar address
export const SYSVAR_INSTRUCTIONS_PUBKEY = new PublicKey('Sysvar1nstructions1111111111111111111111111');
