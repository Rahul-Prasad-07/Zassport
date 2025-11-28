'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useProgram } from '@/hooks/useProgram';
import { 
  generateAgeProof, 
  generateNationalityProof,
  verifyAgeProof,
  verifyNationalityProof,
  formatProofForChain 
} from '@/lib/zkProofsReal';
import { 
  getTestPassportData, 
  calculateAgeFromYYMMDD 
} from '@/lib/passportParser';
import { getIdentityPDA } from '@/lib/anchor';
import { SystemProgram } from '@solana/web3.js';

export function ZKProofGeneratorReal() {
  const { publicKey, connected } = useWallet();
  const program = useProgram();
  const [proofType, setProofType] = useState<'age' | 'nationality'>('age');
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<string>('');
  const [proofData, setProofData] = useState<any>(null);

  const generateProof = async () => {
    if (!connected) {
      setResult('❌ Please connect your wallet first');
      return;
    }

    setGenerating(true);
    setResult('⏳ Generating zero-knowledge proof...');
    setProofData(null);

    try {
      // Get test passport data
      const passportData = getTestPassportData();
      const passportInput = {
        dateOfBirth: passportData.dateOfBirth, // Format: "1985-03-15"
        documentNumber: passportData.documentNumber,
        nationality: passportData.nationality,
      };

      if (proofType === 'age') {
        setResult('⏳ Generating age proof (this may take 10-30 seconds)...');
        
        const { proof, publicSignals, commitment, nullifier } = await generateAgeProof(passportInput);
        
        // Verify proof locally first
        setResult('⏳ Verifying proof locally...');
        const isValid = await verifyAgeProof(proof, publicSignals);
        
        if (!isValid) {
          setResult('❌ Proof verification failed');
          return;
        }

        const age = calculateAgeFromYYMMDD(passportData.dateOfBirth.replace(/-/g, '').slice(2)); // Convert to YYMMDD format
        
        setProofData({ proof, publicSignals, commitment, nullifier });
        setResult(`✅ Age Proof Generated Successfully!

**Current Age**: ${age} years
**Proof Type**: Zero-Knowledge Age Verification (18+)

**Public Signals**:
${publicSignals.map((sig, i) => `  ${i + 1}. ${sig}`).join('\n')}

**Commitment**: ${commitment.slice(0, 20)}...
**Nullifier**: ${nullifier.slice(0, 20)}...

**Status**: ✅ Proof Valid (verified locally)
**Privacy**: Your exact date of birth remains hidden

🎯 **Next Step**: Click "Submit to Blockchain" to verify on-chain
        `);
      } else if (proofType === 'nationality') {
        setResult('⏳ Generating nationality proof (this may take 10-30 seconds)...');
        
        const { proof, publicSignals, commitment, nullifier } = await generateNationalityProof(
          passportInput,
          passportData.nationality
        );
        
        // Verify proof locally first
        setResult('⏳ Verifying proof locally...');
        const isValid = await verifyNationalityProof(proof, publicSignals);
        
        if (!isValid) {
          setResult('❌ Proof verification failed');
          return;
        }

        setProofData({ proof, publicSignals, commitment, nullifier });
        setResult(`✅ Nationality Proof Generated Successfully!

**Nationality**: ${passportData.nationality}
**Proof Type**: Zero-Knowledge Citizenship Verification

**Public Signals**:
${publicSignals.map((sig, i) => `  ${i + 1}. ${sig}`).join('\n')}

**Commitment**: ${commitment.slice(0, 20)}...
**Nullifier**: ${nullifier.slice(0, 20)}...

**Status**: ✅ Proof Valid (verified locally)
**Privacy**: Your nationality remains private

🎯 **Next Step**: Click "Submit to Blockchain" to verify on-chain
        `);
      }
    } catch (error) {
      console.error('Proof generation error:', error);
      setResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}\n\nThis is likely due to circuit loading. The circuit files are large (~5-10MB each).`);
    } finally {
      setGenerating(false);
    }
  };

  const submitToBlockchain = async () => {
    if (!program || !publicKey || !proofData) {
      setResult(prev => prev + '\n\n❌ Cannot submit: Missing wallet or proof data');
      return;
    }

    setSubmitting(true);
    try {
      const identityPda = getIdentityPDA(publicKey);
      const formattedProof = formatProofForChain(proofData.proof);

      if (proofType === 'age') {
        setResult(prev => prev + '\n\n⏳ Submitting age proof to Solana...');
        
        const tx = await program.methods
          .verifyAgeProof(
            formattedProof,
            proofData.publicSignals,
            proofData.commitment,
            proofData.nullifier
          )
          .accounts({
            identity: identityPda,
            authority: publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();

        setResult(prev => prev + `\n\n✅ **Proof Verified On-Chain!**\nTransaction: ${tx}\nView on Explorer: https://explorer.solana.com/tx/${tx}?cluster=devnet`);
      } else {
        setResult(prev => prev + '\n\n⏳ Submitting nationality proof to Solana...');
        
        const tx = await program.methods
          .verifyNationalityProof(
            formattedProof,
            proofData.publicSignals,
            proofData.commitment,
            proofData.nullifier
          )
          .accounts({
            identity: identityPda,
            authority: publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();

        setResult(prev => prev + `\n\n✅ **Proof Verified On-Chain!**\nTransaction: ${tx}\nView on Explorer: https://explorer.solana.com/tx/${tx}?cluster=devnet`);
      }
    } catch (error) {
      console.error('Blockchain submission error:', error);
      setResult(prev => prev + `\n\n❌ Blockchain Error: ${error instanceof Error ? error.message : 'Transaction failed'}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-xl border border-purple-500/30">
      <h2 className="text-2xl font-bold text-white">🔐 Real ZK Proof Generator</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Select Proof Type
          </label>
          <select
            value={proofType}
            onChange={(e) => setProofType(e.target.value as any)}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            disabled={generating || submitting}
          >
            <option value="age">Age Proof (18+)</option>
            <option value="nationality">Nationality Proof</option>
          </select>
        </div>

        <div className="p-4 bg-gray-800/50 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">⚡ Real ZK Proof Generation</h3>
          {proofType === 'age' && (
            <p className="text-sm text-gray-400">
              Generates a <strong>real Groth16 zero-knowledge proof</strong> using Circom circuits. 
              Proves you are 18+ without revealing your birthdate. Takes 10-30 seconds.
            </p>
          )}
          {proofType === 'nationality' && (
            <p className="text-sm text-gray-400">
              Generates a <strong>real Groth16 zero-knowledge proof</strong> using Circom circuits. 
              Proves your nationality without revealing passport details. Takes 10-30 seconds.
            </p>
          )}
        </div>

        <button
          onClick={generateProof}
          disabled={!connected || generating || submitting}
          className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
        >
          {generating ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating Real ZK Proof...
            </span>
          ) : (
            '🚀 Generate Real ZK Proof'
          )}
        </button>

        {proofData && (
          <button
            onClick={submitToBlockchain}
            disabled={!program || submitting}
            className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold rounded-lg transition-all duration-200"
          >
            {submitting ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting to Blockchain...
              </span>
            ) : (
              '⛓️ Submit to Blockchain (Solana Devnet)'
            )}
          </button>
        )}

        {result && (
          <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
            <pre className="text-sm text-green-400 whitespace-pre-wrap font-mono">
              {result}
            </pre>
          </div>
        )}

        {!connected && (
          <div className="p-4 bg-yellow-900/30 border border-yellow-700 rounded-lg">
            <p className="text-sm text-yellow-300">
              ⚠️ Connect your Solana wallet to generate proofs
            </p>
          </div>
        )}

        <div className="p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-300 mb-2">How it Works</h3>
          <ol className="text-xs text-blue-200 space-y-1 list-decimal list-inside">
            <li>Circuit files (.wasm + .zkey) are loaded from /public/circuits/</li>
            <li>Proof is generated using real snarkjs Groth16 prover</li>
            <li>Proof is verified locally before submission</li>
            <li>Proof is submitted to Solana smart contract for on-chain verification</li>
            <li>Transaction is confirmed and recorded on blockchain</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
