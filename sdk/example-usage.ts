import * as anchor from '@coral-xyz/anchor';
import { PublicKey, SYSVAR_INSTRUCTIONS_PUBKEY } from '@solana/web3.js';
import { Program, BN } from '@coral-xyz/anchor';
import { Zassport } from '../target/types/zassport';
import {
  buildAgeMessage,
  buildNatMessage,
  createEd25519Instruction,
  requestAgeAttestation,
} from './attestation-helpers';

/**
 * Example: Complete flow for age verification with attestation
 */
export async function verifyAgeWithAttestation(
  program: Program<Zassport>,
  verifierServiceUrl: string,
  user: anchor.web3.Keypair,
  identityPda: PublicKey,
  commitment: Buffer,
  nullifier: Buffer,
  minAge: number,
  proof: any,
  publicInputs: string[]
): Promise<string> {
  // 1. Request attestation from verifier service
  console.log('📤 Requesting age attestation from verifier service...');
  const attestation = await requestAgeAttestation(
    verifierServiceUrl,
    proof,
    publicInputs,
    user.publicKey.toBase58(),
    identityPda.toBase58(),
    commitment.toString('hex'),
    nullifier.toString('hex'),
    minAge
  );

  console.log('✅ Attestation received');

  // 2. Decode signature and verifier pubkey
  const signature = Buffer.from(attestation.signature, 'base64');
  const verifierPubkey = Buffer.from(attestation.verifierPublicKey, 'base64');
  const message = Buffer.from(attestation.message, 'base64');

  // 3. Create Ed25519 pre-instruction
  const ed25519Ix = createEd25519Instruction(verifierPubkey, message, signature);

  // 4. Find verifier config PDA
  const [verifierConfigPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('verifier_config')],
    program.programId
  );

  // 5. Submit attestation to Solana
  console.log('📝 Submitting attestation to Solana...');
  const tx = await program.methods
    .attestAge(new BN(minAge), new BN(attestation.timestamp))
    .accounts({
      identity: identityPda,
      verifierConfig: verifierConfigPda,
      user: user.publicKey,
      instructions: SYSVAR_INSTRUCTIONS_PUBKEY,
    })
    .preInstructions([ed25519Ix])
    .signers([user])
    .rpc();

  console.log('✅ Age verified on-chain:', tx);
  return tx;
}

/**
 * Example: Initialize verifier config (one-time setup)
 */
export async function initializeVerifierConfig(
  program: Program<Zassport>,
  authority: anchor.web3.Keypair,
  verifierPublicKey: PublicKey
): Promise<string> {
  const [verifierConfigPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('verifier_config')],
    program.programId
  );

  const tx = await program.methods
    .initializeVerifierConfig(verifierPublicKey)
    .accounts({
      verifierConfig: verifierConfigPda,
      authority: authority.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .signers([authority])
    .rpc();

  console.log('✅ Verifier config initialized:', tx);
  return tx;
}
