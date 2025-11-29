'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { generateAgeProof, bigintTo32BytesBE } from '@/lib/zkProofsReal';
import { useProgram } from '@/hooks/useProgram';
import { getNullifierRegistryPDA, getIdentityPDA, PROGRAM_ID } from '@/lib/anchor';

interface PassportData {
  surname: string;
  givenNames: string;
  nationality: string;
  documentNumber: string;
  dateOfBirth: string;
  expiryDate: string;
  issuingCountry: string;
}

// Helper function to calculate age from date of birth
const calculateAge = (dateOfBirth: string): number => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
};

export function IdentityRegistration() {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const program = useProgram();
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [passportData, setPassportData] = useState<PassportData>({
    surname: '',
    givenNames: '',
    nationality: '',
    documentNumber: '',
    dateOfBirth: '',
    expiryDate: '',
    issuingCountry: '',
  });

  const handleInputChange = (field: keyof PassportData, value: string) => {
    setPassportData(prev => ({ ...prev, [field]: value }));
  };

  const handleRegisterIdentity = async () => {
    if (!publicKey) {
      setStatus('Please connect your wallet first');
      return;
    }

    // Validate passport data
    if (!passportData.documentNumber || !passportData.dateOfBirth || !passportData.nationality) {
      setStatus('Please fill in all required passport fields');
      return;
    }

    setIsLoading(true);

    // Production mode - blockchain registration
    if (!program) {
      setStatus('⚠️ Smart contract program not initialized. Please ensure you are connected to Solana devnet.');
      setIsLoading(false);
      return;
    }

    setStatus('🔄 Generating ZK proof...');

    try {
      // Ensure nullifier registry account is initialized
      const registryPda = getNullifierRegistryPDA(PROGRAM_ID);
      const existing = await connection.getAccountInfo(registryPda);
      if (!existing) {
        setStatus('🔄 Initializing registry on-chain...');
        await program.methods
          .initializeProgram()
          .accounts({
            nullifierRegistry: registryPda,
            authority: publicKey,
          })
          .rpc();
      }

      // Generate ZK proof for age verification (18+)
      const proofResult = await generateAgeProof(passportData);

      setStatus('🔄 Submitting proof to blockchain...');

      // Convert to 32-byte big-endian arrays matching on-chain expectation
      const commitmentBytes = bigintTo32BytesBE(proofResult.commitment);
      const nullifierBytes = bigintTo32BytesBE(proofResult.nullifier);

      // Call registerIdentity instruction
      const tx = await program.methods
        .registerIdentity(commitmentBytes, nullifierBytes)
        .accounts({
          user: publicKey,
          nullifierRegistry: registryPda,
        })
        .rpc();

      setStatus(`✅ Identity registered successfully! TX: ${tx.slice(0, 8)}...`);

    } catch (error: any) {
      console.error('Registration failed:', error);
      setStatus(`❌ Registration failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-semibold text-white mb-2">
          Register Your ZK Identity
        </h3>
        <p className="text-gray-300 mb-4">
          Create a privacy-preserving identity using zero-knowledge proofs from your passport data.
        </p>
      </div>

      {/* Passport Data Input Form */}
      <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
        <h4 className="font-medium text-white mb-4">Enter Your Passport Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Surname *
            </label>
            <input
              type="text"
              value={passportData.surname}
              onChange={(e) => handleInputChange('surname', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ERIKSSON"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Given Names *
            </label>
            <input
              type="text"
              value={passportData.givenNames}
              onChange={(e) => handleInputChange('givenNames', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ANNA MARIA"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nationality *
            </label>
            <input
              type="text"
              value={passportData.nationality}
              onChange={(e) => handleInputChange('nationality', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="SWE"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Document Number *
            </label>
            <input
              type="text"
              value={passportData.documentNumber}
              onChange={(e) => handleInputChange('documentNumber', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="L898902C3"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date of Birth *
            </label>
            <input
              type="date"
              value={passportData.dateOfBirth}
              onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expiry Date
            </label>
            <input
              type="date"
              value={passportData.expiryDate}
              onChange={(e) => handleInputChange('expiryDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          * Required fields. Your data is processed locally and never stored.
        </p>
      </div>

      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="font-medium text-gray-900 mb-3">What happens when you register:</h4>
        <ul className="space-y-2 text-sm text-gray-600">
          <li>• Your passport data is processed locally on your device</li>
          <li>• Zero-knowledge proof is generated to verify age (18+)</li>
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
          status.includes('❌') || status.includes('failed') || status.includes('connect')
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