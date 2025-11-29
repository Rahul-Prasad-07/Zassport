'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import * as anchor from '@coral-xyz/anchor';
import { Buffer } from 'buffer';
import { 
  getTestPassportData, 
  parsePassportForZK, 
  calculateAgeFromYYMMDD 
} from '@/lib/passportParser';
import { generateAgeProof, generateNationalityProof, formatProofForChain } from '@/lib/zkProofsReal';
import { useProgram } from '@/hooks/useProgram';
import { getIdentityPDA, getVerifierConfigPDA, SYSVAR_INSTRUCTIONS_PUBKEY } from '@/lib/anchor';
import { getNationalityCode, bigintTo32BytesBE } from '@/lib/zkProofsReal';

export function ZKProofGenerator() {
  const { publicKey, connected } = useWallet();
  const program = useProgram();
  const [proofType, setProofType] = useState<'age' | 'nationality' | 'passport'>('age');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<string>('');
  const [proofResult, setProofResult] = useState<any>(null);
  const [lastPassportData, setLastPassportData] = useState<any>(null);

  const generateProof = async () => {
    if (!connected) {
      setResult('Please connect your wallet first');
      return;
    }

    setGenerating(true);
    setResult('');
    setProofResult(null);

    try {
      // Get test passport data
      const passportData = getTestPassportData();
      setLastPassportData(passportData);
      const parsedData = parsePassportForZK(passportData);

      // Calculate current timestamp
      const currentTimestamp = Math.floor(Date.now() / 1000);

      if (proofType === 'age') {
        // Generate real age proof
        const proof = await generateAgeProof(passportData);
        setProofResult(proof);
        
        setResult(`
✅ Age Proof Generated Successfully!

📊 Proof Details:
- Commitment: ${proof.commitment.slice(0, 16)}...
- Nullifier: ${proof.nullifier.slice(0, 16)}...
- Age Verified: 18+
- Proof Size: ${JSON.stringify(proof.proof).length} bytes

🔒 Privacy: Your exact date of birth remains hidden
⚡ Status: Ready for on-chain attestation
        `);
      } else if (proofType === 'nationality') {
        // Generate real nationality proof
        const proof = await generateNationalityProof(passportData, passportData.nationality);
        // retain allowed nationality for verification
        const allowedNationality = getNationalityCode(passportData.nationality);
        setProofResult({ ...proof, allowedNationality });
        
        setResult(`
✅ Nationality Proof Generated Successfully!

📊 Proof Details:
- Commitment: ${proof.commitment.slice(0, 16)}...
- Nullifier: ${proof.nullifier.slice(0, 16)}...
- Nationality: ${passportData.nationality}
- Proof Size: ${JSON.stringify(proof.proof).length} bytes

🔒 Privacy: Your nationality data remains private
⚡ Status: Ready for on-chain attestation
        `);
      } else {
        setResult(`
❌ Passport Proof Not Yet Implemented

The passport verification circuit is still under development.
Currently available: Age and Nationality proofs.

Please select Age or Nationality proof type.
        `);
      }
    } catch (error) {
      console.error('Proof generation error:', error);
      setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setGenerating(false);
    }
  };

  const attestProof = async (proofData: any, type: string) => {
    if (!program || !publicKey) {
      return '❌ Program not initialized or wallet not connected.';
    }

    try {
      // First check if verifier config is initialized
      const verifierConfigPDA = getVerifierConfigPDA();
      const verifierConfigAccount = await program.provider.connection.getAccountInfo(verifierConfigPDA);
      
      if (!verifierConfigAccount) {
        // Need to initialize verifier config first
        // Get verifier public key from health endpoint
        const healthResponse = await fetch('http://localhost:3000/health');
        const healthData = await healthResponse.json();
        const verifierPubKeyHex = healthData.verifierPublicKey;
        const verifierPubKeyBytes = Buffer.from(verifierPubKeyHex, 'hex');
        const verifierPubKey = new anchor.web3.PublicKey(verifierPubKeyBytes);

        console.log('Initializing verifier config with pubkey:', verifierPubKey.toBase58());

        try {
          await program.methods
            .initializeVerifierConfig(verifierPubKey)
            .accounts({
              verifierConfig: verifierConfigPDA,
              authority: publicKey,
              systemProgram: anchor.web3.SystemProgram.programId,
            })
            .rpc();
          console.log('Verifier config initialized successfully');
        } catch (initError: any) {
          // If already initialized by someone else, continue
          if (!initError.message?.includes('already in use')) {
            throw initError;
          }
        }
      }

      // Fetch the on-chain identity to get the registered commitment and nullifier
      const identityPDA = getIdentityPDA(publicKey);
      console.log('Fetching identity from PDA:', identityPDA.toBase58());
      const identityAccount = await (program.account as any).identity.fetch(identityPDA);
      
      // Convert on-chain bytes to decimal strings for the verifier
      console.log('Raw identity commitment bytes:', Array.from(identityAccount.commitment).slice(0, 8));
      const onChainCommitment = BigInt('0x' + Buffer.from(identityAccount.commitment).toString('hex')).toString();
      const onChainNullifier = BigInt('0x' + Buffer.from(identityAccount.nullifier).toString('hex')).toString();

      console.log('On-chain identity data:', {
        commitment: onChainCommitment,
        nullifier: onChainNullifier,
      });

      // Send proof to verifier service
      const verifierUrl = 'http://localhost:3000';
      const endpoint = type === 'age' ? '/verify-age' : '/verify-nationality';

      console.log('Sending proof to verifier:', { type, owner: publicKey.toBase58() });

      const requestBody = {
        proof: proofData.proof,
        publicInputs: proofData.publicSignals || proofData.publicInputs || [],
        owner: publicKey.toBase58(),
        identity: identityPDA.toBase58(),
        commitment: onChainCommitment,
        nullifier: onChainNullifier,
        ...(type === 'age' ? { minAge: 18 } : { allowedNationality: proofData.allowedNationality ?? 0 }),
      };

      console.log('Request body:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(`${verifierUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const responseData = await response.json();
      console.log('Verifier response:', responseData);

      if (!response.ok) {
        throw new Error(`Verifier error: ${responseData.error || response.statusText}`);
      }

      if (!responseData.success) {
        throw new Error(responseData.error || 'Attestation failed');
      }

      // Submit attestation on-chain
      const message = Buffer.from(responseData.attestation.message, 'base64');
      const signature = Buffer.from(responseData.attestation.signature, 'base64');
      const verifierPubKey = Buffer.from(responseData.verifierPublicKey, 'base64');

      console.log('Attestation data:', {
        messageLen: message.length,
        messageHex: message.toString('hex').slice(0, 100) + '...',
        signatureLen: signature.length,
        verifierPubKeyLen: verifierPubKey.length,
        verifierPubKeyHex: Buffer.from(verifierPubKey).toString('hex'),
      });

      // Verify the verifier public key matches what's stored on-chain
      const verifierConfig = await (program.account as any).verifierConfig.fetch(verifierConfigPDA);
      console.log('On-chain verifier key:', verifierConfig.verifier.toBase58());
      console.log('Verifier key from response (as Solana pubkey):', new anchor.web3.PublicKey(verifierPubKey).toBase58());

      // Create Ed25519 pre-instruction
      const ed25519Ix = anchor.web3.Ed25519Program.createInstructionWithPublicKey({
        publicKey: verifierPubKey,
        message,
        signature,
        instructionIndex: 0,
      });

      const timestamp = responseData.attestation.timestamp;
      const minAge = responseData.attestation.minAge;
      const allowedNationality = responseData.attestation.allowedNationality;

      let tx;
      if (type === 'age') {
        tx = await program.methods
          .attestAge(new anchor.BN(minAge), new anchor.BN(timestamp))
          .accounts({
            identity: identityPDA,
            verifierConfig: verifierConfigPDA,
            user: publicKey,
            instructions: SYSVAR_INSTRUCTIONS_PUBKEY,
          })
          .preInstructions([ed25519Ix])
          .rpc();
      } else {
        tx = await program.methods
          .attestNationality(new anchor.BN(allowedNationality || 0), new anchor.BN(timestamp))
          .accounts({
            identity: identityPDA,
            verifierConfig: verifierConfigPDA,
            user: publicKey,
            instructions: SYSVAR_INSTRUCTIONS_PUBKEY,
          })
          .preInstructions([ed25519Ix])
          .rpc();
      }

      return `✅ Attestation successful! TX: ${tx.slice(0, 8)}...`;
    } catch (error) {
      console.error('Attestation error:', error);
      return `❌ Attestation failed: ${(error as Error).message}`;
    }
  };

  const handleVerifyOnChain = async () => {
    if (!proofResult) {
      setResult('No proof available. Generate a proof first.');
      return;
    }

    setGenerating(true);
    setResult('Submitting proof for attestation...');

    const verificationResult = await attestProof(proofResult, proofType);
    if (verificationResult) {
      setResult(verificationResult);
    } else {
      setResult('❌ Verification type not supported yet');
    }

    setGenerating(false);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white text-center">ZK Proof Generator</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Select Proof Type
          </label>
          <select
            value={proofType}
            onChange={(e) => setProofType(e.target.value as any)}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="age">Age Range Proof</option>
            <option value="nationality">Nationality Proof</option>
            <option value="passport">Passport Verification</option>
          </select>
        </div>

        <div className="p-4 bg-gray-800/50 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">Proof Description</h3>
          {proofType === 'age' && (
            <p className="text-sm text-gray-400">
              Proves you are within a specific age range (e.g., 18-120 years) without revealing your exact date of birth.
            </p>
          )}
          {proofType === 'nationality' && (
            <p className="text-sm text-gray-400">
              Proves your citizenship without revealing your nationality or passport details.
            </p>
          )}
          {proofType === 'passport' && (
            <p className="text-sm text-gray-400">
              Validates the authenticity of your passport using RSA signature verification without exposing sensitive data.
            </p>
          )}
        </div>

        <button
          onClick={generateProof}
          disabled={!connected || generating}
          className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
        >
          {generating ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating Proof...
            </span>
          ) : (
            'Generate ZK Proof'
          )}
        </button>

        {proofResult && program && (
          <button
            onClick={handleVerifyOnChain}
            disabled={!connected || generating}
            className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
          >
            {generating ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Attesting...
              </span>
            ) : (
              'Attest Proof'
            )}
          </button>
        )}

        {proofResult && !program && (
          <div className="p-4 bg-yellow-900/30 border border-yellow-600/50 rounded-lg">
            <p className="text-sm text-yellow-300">
              ⚠️ Attestation is not available. The smart contract program could not be initialized. 
              Make sure you're connected to Solana devnet and the verifier service is running.
            </p>
          </div>
        )}

        {!connected && (
          <p className="text-sm text-yellow-400 text-center">
            Please connect your wallet to generate proofs
          </p>
        )}
      </div>

      {result && (
        <div className="mt-6 p-4 bg-gray-900/80 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-2">Result</h3>
          <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono">
            {result}
          </pre>
        </div>
      )}
    </div>
  );
}
