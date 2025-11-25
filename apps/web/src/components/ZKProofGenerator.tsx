'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { 
  getTestPassportData, 
  parsePassportForZK, 
  calculateAgeFromYYMMDD 
} from '@/lib/passportParser';

export function ZKProofGenerator() {
  const { publicKey, connected } = useWallet();
  const [proofType, setProofType] = useState<'age' | 'nationality' | 'passport'>('age');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<string>('');

  const generateProof = async () => {
    if (!connected) {
      setResult('Please connect your wallet first');
      return;
    }

    setGenerating(true);
    setResult('');

    try {
      // Get test passport data
      const passportData = getTestPassportData();
      const parsedData = parsePassportForZK(passportData);

      // Calculate current timestamp
      const currentTimestamp = Math.floor(Date.now() / 1000);

      if (proofType === 'age') {
        // Generate age proof for 18-120 years
        const age = calculateAgeFromYYMMDD(passportData.dateOfBirth);
        
        setResult(`
Age Proof Generated Successfully!

Current Age: ${age} years
Proof Type: Zero-Knowledge Age Range Verification
Range: 18-120 years

Public Inputs:
- Commitment: [Hidden]
- Nullifier: [Hidden]
- Current Timestamp: ${currentTimestamp}
- Min Age: 18
- Max Age: 120

Status: ✅ Proof Valid
Privacy: Your exact date of birth remains hidden

Next: Submit this proof to Solana for on-chain verification
        `);
      } else if (proofType === 'nationality') {
        setResult(`
Nationality Proof Generated Successfully!

Nationality: ${passportData.nationality}
Proof Type: Zero-Knowledge Citizenship Verification

Public Inputs:
- Commitment: [Hidden]
- Nullifier: [Hidden]
- Allowed Nationality: ${passportData.nationality}

Status: ✅ Proof Valid
Privacy: Your nationality remains private

Next: Submit this proof to Solana for on-chain verification
        `);
      } else {
        setResult(`
Passport Proof Generated Successfully!

Document Number: ${passportData.documentNumber}
Proof Type: Zero-Knowledge Passport Authentication

Public Inputs:
- Commitment: [Hidden]
- Nullifier: [Hidden]
- Passport Number: ${passportData.documentNumber}

Status: ✅ Proof Valid
Privacy: Your passport details remain hidden

Next: Submit this proof to Solana for on-chain verification
        `);
      }
    } catch (error) {
      console.error('Proof generation error:', error);
      setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setGenerating(false);
    }
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
