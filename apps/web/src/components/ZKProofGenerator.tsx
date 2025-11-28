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
import { getIdentityPDA } from '@/lib/anchor';
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
⚡ Status: Ready for on-chain verification

${program ? 'Click "Verify Proof On-Chain" to submit to Solana' : '⚠️ On-chain verification requires program initialization'}
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
⚡ Status: Ready for on-chain verification

${program ? 'Click "Verify Proof On-Chain" to submit to Solana' : '⚠️ On-chain verification requires program initialization'}
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

  const verifyProofOnChain = async (proofData: any, type: string) => {
    if (!program || !publicKey) {
      return '❌ Program not initialized or wallet not connected. Please ensure your wallet is connected and the program is deployed.';
    }

    try {
      // Convert commitment and nullifier using big-endian 32-byte packing
      const commitmentBytes = bigintTo32BytesBE(proofData.commitment);
      const nullifierBytes = bigintTo32BytesBE(proofData.nullifier);

      const proofObject = formatProofForChain(proofData.proof);
      const proofBytes = Buffer.from(JSON.stringify(proofObject));

      const identityPda = getIdentityPDA(publicKey);

      if (type === 'age') {
        const currentTimestamp = Math.floor(Date.now() / 1000);
        const minAge = 18;
        const maxAge = 120;

        const tx = await program.methods
          .verifyAgeProof(
            commitmentBytes,
            nullifierBytes,
            new anchor.BN(currentTimestamp),
            new anchor.BN(minAge),
            new anchor.BN(maxAge),
            proofBytes
          )
          .accounts({
            identity: identityPda,
            user: publicKey,
          })
          .rpc();

        return `✅ On-chain verification successful! TX: ${tx.slice(0, 8)}...`;
      } else if (type === 'nationality') {
        const allowedNationality = proofData.allowedNationality ?? (lastPassportData ? getNationalityCode(lastPassportData.nationality) : 0);
        const tx = await program.methods
          .verifyNationalityProof(
            commitmentBytes,
            nullifierBytes,
            new anchor.BN(allowedNationality),
            proofBytes
          )
          .accounts({
            identity: identityPda,
            user: publicKey,
          })
          .rpc();

        return `✅ On-chain verification successful! TX: ${tx.slice(0, 8)}...`;
      }
    } catch (error) {
      console.error('On-chain verification failed:', error);
      return `❌ On-chain verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
    return null;
  };

  const handleVerifyOnChain = async () => {
    if (!proofResult) {
      setResult('No proof available. Generate a proof first.');
      return;
    }

    setGenerating(true);
    setResult('Submitting proof for on-chain verification...');

    const verificationResult = await verifyProofOnChain(proofResult, proofType);
    if (verificationResult) {
      setResult(verificationResult);
    } else {
      setResult('❌ Verification type not supported yet');
    }

    setGenerating(false);
  };

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-xl border border-purple-500/30">
      <h2 className="text-2xl font-bold text-white">ZK Proof Generator</h2>
      
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
                Verifying On-Chain...
              </span>
            ) : (
              'Verify Proof On-Chain'
            )}
          </button>
        )}

        {proofResult && !program && (
          <div className="p-4 bg-yellow-900/30 border border-yellow-600/50 rounded-lg">
            <p className="text-sm text-yellow-300">
              ⚠️ On-chain verification is not available. The smart contract program could not be initialized. 
              Make sure you're connected to Solana devnet.
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
