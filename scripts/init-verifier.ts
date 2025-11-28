import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { PublicKey, Keypair } from '@solana/web3.js';
import { Zassport } from '../target/types/zassport';
import fs from 'fs';

/**
 * Initialize verifier config on-chain
 * Usage: ts-node scripts/init-verifier.ts <verifier-pubkey-hex>
 */

async function main() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Zassport as Program<Zassport>;
  const authority = (provider.wallet as anchor.Wallet).payer;

  // Read verifier public key from args or prompt
  const verifierPubkeyHex = process.argv[2];
  
  if (!verifierPubkeyHex || verifierPubkeyHex.length !== 64) {
    console.error('❌ Usage: ts-node scripts/init-verifier.ts <verifier-pubkey-hex>');
    console.error('');
    console.error('Get verifier public key from:');
    console.error('  cd verifier-service && node scripts/generate-keypair.js');
    process.exit(1);
  }

  const verifierPublicKey = new PublicKey(Buffer.from(verifierPubkeyHex, 'hex'));

  console.log('🔧 Initializing verifier config...');
  console.log('   Authority:', authority.publicKey.toBase58());
  console.log('   Verifier:', verifierPublicKey.toBase58());
  console.log('');

  const [verifierConfigPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('verifier_config')],
    program.programId
  );

  try {
    const tx = await program.methods
      .initializeVerifierConfig(verifierPublicKey)
      .accounts({
        verifierConfig: verifierConfigPda,
        authority: authority.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log('✅ Verifier config initialized!');
    console.log('   Transaction:', tx);
    console.log('   Config PDA:', verifierConfigPda.toBase58());
    console.log('');
    console.log('Next: Start verifier service with this public key');
  } catch (error) {
    if (error.message.includes('already in use')) {
      console.log('ℹ️  Verifier config already initialized');
      console.log('   Config PDA:', verifierConfigPda.toBase58());
      
      const config = await program.account.verifierConfig.fetch(verifierConfigPda);
      console.log('   Current verifier:', config.verifier.toBase58());
    } else {
      throw error;
    }
  }
}

main().catch(console.error);
