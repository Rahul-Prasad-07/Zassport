'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { generateAgeProof, bigintTo32BytesBE } from '@/lib/zkProofsReal';
import { useProgram } from '@/hooks/useProgram';
import { getNullifierRegistryPDA, getIdentityPDA, PROGRAM_ID } from '@/lib/anchor';
import { usePassportData, type PassportData } from '@/contexts/PassportDataContext';
import { NFCReaderUI, type PassportData as NFCPassportData } from '@/components/NFCReaderUI';

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
  const { passportData: contextPassportData, setPassportData: setContextPassportData, setIsRegistered } = usePassportData();
  
  const [isLoading, setIsLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [identityExists, setIdentityExists] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [showScanner, setShowScanner] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [localPassportData, setLocalPassportData] = useState<PassportData>({
    surname: '',
    givenNames: '',
    nationality: '',
    documentNumber: '',
    dateOfBirth: '',
    dateOfExpiry: '',
    expiryDate: '',
    issuingCountry: '',
    documentType: 'P',
    sex: '',
  });

  // Auto-fill from context on mount
  useEffect(() => {
    if (contextPassportData) {
      console.log('Auto-filling registration form with passport data from context');
      setLocalPassportData(contextPassportData);
    }
  }, [contextPassportData]);

  // Check if identity already exists when wallet connects
  useEffect(() => {
    if (publicKey && program) {
      checkIdentityExists();
    } else {
      // Clear registration state when wallet disconnects
      setIdentityExists(false);
      setIsRegistered(false);
      setStatus('');
    }
  }, [publicKey, program]);

  const checkIdentityExists = async () => {
    if (!publicKey || !program) return;
    
    setChecking(true);
    try {
      const identityPDA = getIdentityPDA(publicKey);
      console.log('🔍 Checking identity for wallet:', publicKey.toString());
      console.log('🔍 Identity PDA:', identityPDA.toString());
      
      const account = await connection.getAccountInfo(identityPDA);
      console.log('🔍 Account info:', account ? 'EXISTS' : 'NOT FOUND');
      
      if (account && account.data && account.data.length > 0) {
        console.log('✅ Identity account found on-chain');
        setIdentityExists(true);
        setIsRegistered(true);
        setStatus('✅ Identity already registered on-chain!');
      } else {
        console.log('❌ No identity found - ready to register');
        setIdentityExists(false);
        setIsRegistered(false);
        setStatus('');
      }
    } catch (e) {
      console.log('❌ Error checking identity:', e);
      setIdentityExists(false);
      setIsRegistered(false);
      setStatus('');
    } finally {
      setChecking(false);
    }
  };

  const handleInputChange = (field: keyof PassportData, value: string) => {
    setLocalPassportData(prev => ({ ...prev, [field]: value }));
  };

  const handleScanComplete = async (nfcData: NFCPassportData) => {
    console.log('📷 Scan completed, processing data:', nfcData);
    
    // Normalize NFCPassportData to PassportData format
    const nameParts = nfcData.fullName?.split(' ') || [];
    const normalizedData: PassportData = {
      surname: nameParts[0] || '',
      givenNames: nameParts.slice(1).join(' ') || '',
      nationality: nfcData.nationality || '',
      documentNumber: nfcData.documentNumber || '',
      dateOfBirth: nfcData.dateOfBirth || '',
      dateOfExpiry: nfcData.expirationDate || '',
      expiryDate: nfcData.expirationDate || '',
      issuingCountry: nfcData.nationality || '',
      documentType: 'P',
      sex: nfcData.sex || 'X',
    };

    console.log('📋 Normalized passport data:', normalizedData);
    
    setLocalPassportData(normalizedData);
    setContextPassportData(normalizedData);
    setScanComplete(true);
    setShowScanner(false);
    
    // Validate that we have required fields
    const hasRequiredFields = normalizedData.documentNumber && normalizedData.dateOfBirth && normalizedData.nationality;
    if (hasRequiredFields) {
      setStatus('✅ Passport scanned successfully! Ready to register.');
    } else {
      setStatus('⚠️ Scan complete but some fields missing. Please fill remaining fields manually.');
    }
  };

  const handleRegisterIdentity = async () => {
    if (!publicKey) {
      setStatus('Please connect your wallet first');
      return;
    }

    // Validate passport data with detailed feedback
    const missingFields = [];
    if (!localPassportData.documentNumber) missingFields.push('Document Number');
    if (!localPassportData.dateOfBirth) missingFields.push('Date of Birth');
    if (!localPassportData.nationality) missingFields.push('Nationality');
    
    if (missingFields.length > 0) {
      console.log('❌ Validation failed. Missing fields:', missingFields);
      console.log('Current passport data:', localPassportData);
      setStatus(`Please fill in: ${missingFields.join(', ')}`);
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
      const proofResult = await generateAgeProof(localPassportData);

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

      // Save passport data to context for proof generation
      // Normalize data to ensure all required fields are present
      const normalizedData: PassportData = {
        ...localPassportData,
        dateOfExpiry: localPassportData.dateOfExpiry || localPassportData.expiryDate || '',
        expiryDate: localPassportData.expiryDate || localPassportData.dateOfExpiry || '',
        issuingState: localPassportData.issuingState || localPassportData.issuingCountry,
        documentType: localPassportData.documentType || 'P',
      };
      
      setContextPassportData(normalizedData);
      setIsRegistered(true);
      setIdentityExists(true);
      
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
        
        {/* Show status badge */}
        {checking && (
          <div className="inline-block px-4 py-2 bg-blue-500/20 text-blue-300 rounded-lg text-sm">
            🔄 Checking identity status...
          </div>
        )}
        {identityExists && (
          <div className="inline-block px-4 py-2 bg-green-500/20 text-green-300 rounded-lg text-sm">
            ✅ Identity already registered - ready to generate proofs!
          </div>
        )}
        {scanComplete && !identityExists && (
          <div className="inline-block px-4 py-2 bg-purple-500/20 text-purple-300 rounded-lg text-sm">
            📷 Passport data loaded - ready to register!
          </div>
        )}
      </div>

      {/* Show Scanner if scan button was clicked */}
      {showScanner && !identityExists && (
        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-white">Scan Your Passport</h4>
            <button
              onClick={() => setShowScanner(false)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              ✕ Cancel
            </button>
          </div>
          <NFCReaderUI onScanComplete={handleScanComplete} />
        </div>
      )}

      {/* Passport Data Input Form */}
      {!showScanner && !identityExists && (
        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-white">Enter Your Passport Information</h4>
            <button
              onClick={() => setShowScanner(true)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Scan Passport
            </button>
          </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Surname *
            </label>
            <input
              type="text"
              value={localPassportData.surname}
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
              value={localPassportData.givenNames}
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
              value={localPassportData.nationality}
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
              value={localPassportData.documentNumber}
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
              value={localPassportData.dateOfBirth}
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
              value={localPassportData.expiryDate}
              onChange={(e) => handleInputChange('expiryDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
          <p className="text-xs text-gray-500 mt-2">
            * Required fields. Your data is processed locally and never stored.
          </p>
        </div>
      )}

      {!identityExists && (
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
      )}

      <div className="flex justify-center">
        <button
          onClick={handleRegisterIdentity}
          disabled={!publicKey || isLoading || identityExists}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-8 rounded-lg transition-colors"
        >
          {isLoading ? 'Registering...' : identityExists ? 'Already Registered ✓' : 'Register ZK Identity'}
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