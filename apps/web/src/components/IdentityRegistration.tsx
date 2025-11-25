'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';

export function IdentityRegistration() {
  const { publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string>('');

  const handleRegisterIdentity = async () => {
    if (!publicKey || !signTransaction) {
      setStatus('Please connect your wallet first');
      return;
    }

    setIsLoading(true);
    setStatus('Registering identity...');

    try {
      // For demo purposes, we'll use mock commitment and nullifier
      // In production, this would come from ZK proof generation
      const commitment = Array.from({length: 32}, () => Math.floor(Math.random() * 256));
      const nullifier = Array.from({length: 32}, () => Math.floor(Math.random() * 256));

      // Program ID from Anchor.toml
      const programId = new PublicKey('5sCDzoF1pzHisqrrpmfbDynCdjgBJX9FcmVBvJzBio2V');

      // Create PDAs
      const [identityPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("identity"), publicKey.toBuffer()],
        programId
      );

      const [reputationPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("reputation"), identityPda.toBuffer()],
        programId
      );

      const [nullifierRegistryPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("nullifier_registry")],
        programId
      );

      // Create Anchor provider
      const provider = new anchor.AnchorProvider(
        connection,
        { publicKey, signTransaction } as any,
        { commitment: 'confirmed' }
      );

      // For now, we'll use a simple approach - in production you'd load the full IDL
      // This is a simplified version for demo purposes
      setStatus('Identity registration simulation completed! (Full implementation coming with ZK proofs)');

    } catch (error: any) {
      console.error('Registration failed:', error);
      setStatus(`Registration failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-semibold text-gray-900 mb-2">
          Register Your ZK Identity
        </h3>
        <p className="text-gray-600">
          Create a privacy-preserving identity using zero-knowledge proofs from your passport data.
        </p>
      </div>

      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="font-medium text-gray-900 mb-3">What happens when you register:</h4>
        <ul className="space-y-2 text-sm text-gray-600">
          <li>• Your passport data is processed locally on your device</li>
          <li>• Only cryptographic commitments are stored on Solana</li>
          <li>• Your personal information remains completely private</li>
          <li>• You gain access to governance and reputation features</li>
        </ul>
      </div>

      <div className="flex justify-center">
        <button
          onClick={handleRegisterIdentity}
          disabled={!publicKey || isLoading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-8 rounded-lg transition-colors"
        >
          {isLoading ? 'Registering...' : 'Register ZK Identity'}
        </button>
      </div>

      {status && (
        <div className={`text-center p-4 rounded-lg ${
          status.includes('failed') || status.includes('connect')
            ? 'bg-red-50 text-red-700 border border-red-200'
            : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          {status}
        </div>
      )}

      {!publicKey && (
        <div className="text-center text-gray-500">
          Please connect your Solana wallet to register an identity
        </div>
      )}
    </div>
  );
}