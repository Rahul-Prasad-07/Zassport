'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Connection, PublicKey } from '@solana/web3.js';
import { config } from '@/lib/config';
import { getIdentityPDA, PROGRAM_ID } from '@/lib/anchor';

// Identity account data layout (matches Solana program)
interface IdentityData {
  owner: string;
  commitmentHash: string;
  nullifier: string;
  reputationScore: number;
  lastUpdated: number;
  isActive: boolean;
  bump: number;
  ageVerified: boolean;
  nationalityVerified: boolean;
  lastAttestationTs: number;
}

interface VerificationResult {
  status: 'idle' | 'loading' | 'success' | 'not-found' | 'error';
  data: IdentityData | null;
  error: string | null;
}

export default function ExternalVerifyPage() {
  const [walletAddress, setWalletAddress] = useState('');
  const [result, setResult] = useState<VerificationResult>({
    status: 'idle',
    data: null,
    error: null,
  });

  // Parse identity account data from raw bytes
  // Layout: 8-byte discriminator + Identity struct
  const parseIdentityAccount = (data: Buffer): IdentityData => {
    // Skip 8-byte discriminator
    let offset = 8;
    
    // Owner (32 bytes - Pubkey)
    const owner = new PublicKey(data.slice(offset, offset + 32)).toString();
    offset += 32;
    
    // Commitment (32 bytes - [u8; 32])
    const commitmentHash = '0x' + data.slice(offset, offset + 32).toString('hex');
    offset += 32;
    
    // Nullifier (32 bytes - [u8; 32])
    const nullifier = '0x' + data.slice(offset, offset + 32).toString('hex');
    offset += 32;
    
    // Reputation score (8 bytes - u64)
    const reputationScore = Number(data.readBigUInt64LE(offset));
    offset += 8;
    
    // Last updated (8 bytes - i64)
    const lastUpdated = Number(data.readBigInt64LE(offset));
    offset += 8;
    
    // Is active (1 byte - bool)
    const isActive = data[offset] === 1;
    offset += 1;
    
    // Bump (1 byte - u8)
    const bump = data[offset];
    offset += 1;
    
    // Age verified (1 byte - bool)
    const ageVerified = data[offset] === 1;
    offset += 1;
    
    // Nationality verified (1 byte - bool)
    const nationalityVerified = data[offset] === 1;
    offset += 1;
    
    // Last attestation timestamp (8 bytes - i64)
    const lastAttestationTs = Number(data.readBigInt64LE(offset));
    
    console.log('🔍 Parsed identity account:', {
      owner: owner.slice(0, 8) + '...',
      commitmentHash: commitmentHash.slice(0, 16) + '...',
      ageVerified,
      nationalityVerified,
      lastAttestationTs,
      rawBytes: {
        ageVerifiedByte: data[offset - 10],
        nationalityVerifiedByte: data[offset - 9],
      }
    });
    
    return {
      owner,
      commitmentHash,
      nullifier,
      reputationScore,
      lastUpdated,
      isActive,
      bump,
      ageVerified,
      nationalityVerified,
      lastAttestationTs,
    };
  };

  const verifyWallet = useCallback(async (address: string) => {
    if (!address.trim()) {
      setResult({ status: 'idle', data: null, error: null });
      return;
    }

    setResult({ status: 'loading', data: null, error: null });

    try {
      // Validate the address
      let pubkey: PublicKey;
      try {
        pubkey = new PublicKey(address.trim());
      } catch {
        setResult({
          status: 'error',
          data: null,
          error: 'Invalid Solana wallet address',
        });
        return;
      }

      // Connect to Solana
      const connection = new Connection(config.rpcUrl, 'confirmed');
      
      // Derive the identity PDA
      const identityPDA = getIdentityPDA(pubkey);
      console.log('🔍 Checking identity PDA:', identityPDA.toString());

      // Fetch account data
      const accountInfo = await connection.getAccountInfo(identityPDA);

      if (!accountInfo || !accountInfo.data) {
        setResult({
          status: 'not-found',
          data: null,
          error: null,
        });
        return;
      }

      // Parse the account data
      const identityData = parseIdentityAccount(Buffer.from(accountInfo.data));
      
      setResult({
        status: 'success',
        data: identityData,
        error: null,
      });
    } catch (error) {
      console.error('Verification error:', error);
      setResult({
        status: 'error',
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  }, []);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    verifyWallet(walletAddress);
  };

  // Format timestamp to readable date
  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <div className="min-h-screen" style={{ background: '#0a0f14' }}>
      {/* Header */}
      <header className="sticky top-0 z-50" style={{ 
        background: 'rgba(10, 15, 20, 0.9)', 
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(148, 163, 184, 0.1)'
      }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <span className="text-lg font-semibold text-white">Zassport</span>
              </Link>
              <span className="text-slate-500">|</span>
              <span className="text-slate-400 text-sm">External Verification</span>
            </div>
            <Link href="/claims" className="text-sm text-slate-400 hover:text-white transition-colors">
              Go to Dashboard →
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        {/* Page Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6" style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
            <svg className="w-4 h-4" style={{ color: '#3b82f6' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="text-sm font-medium" style={{ color: '#60a5fa' }}>For External Services</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Verify Identity Attestations
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Check on-chain attestation status for any Zassport user. External services can use this to verify user credentials without accessing private data.
          </p>
        </div>

        {/* Search Form */}
        <div className="rounded-2xl p-8 mb-8" style={{ background: '#1a222d', border: '1px solid rgba(148, 163, 184, 0.1)' }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="wallet" className="block text-sm font-medium text-gray-300 mb-2">
                Solana Wallet Address
              </label>
              <input
                id="wallet"
                type="text"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="Enter wallet address to verify (e.g., 7xKX...)"
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 font-mono text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={!walletAddress.trim() || result.status === 'loading'}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200"
            >
              {result.status === 'loading' ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Verifying...
                </span>
              ) : (
                '🔍 Verify Attestations'
              )}
            </button>
          </form>
        </div>

        {/* Results */}
        {result.status === 'not-found' && (
          <div className="rounded-2xl p-8 text-center" style={{ background: '#1a222d', border: '1px solid rgba(251, 191, 36, 0.2)' }}>
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(251, 191, 36, 0.15)' }}>
              <svg className="w-8 h-8" style={{ color: '#fbbf24' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No Identity Found</h3>
            <p className="text-slate-400">
              This wallet has not registered an identity on Zassport yet.
            </p>
          </div>
        )}

        {result.status === 'error' && (
          <div className="rounded-2xl p-8 text-center" style={{ background: '#1a222d', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(239, 68, 68, 0.15)' }}>
              <svg className="w-8 h-8" style={{ color: '#ef4444' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Verification Failed</h3>
            <p className="text-slate-400">{result.error}</p>
          </div>
        )}

        {result.status === 'success' && result.data && (
          <div className="rounded-2xl p-8" style={{ background: '#1a222d', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(16, 185, 129, 0.15)' }}>
                <svg className="w-6 h-6" style={{ color: '#10b981' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">Identity Found</h3>
                <p className="text-slate-400 text-sm font-mono">
                  {result.data.owner.slice(0, 8)}...{result.data.owner.slice(-8)}
                </p>
              </div>
            </div>

            {/* Status Badge */}
            {!result.data.isActive && (
              <div className="mb-6 px-4 py-3 rounded-xl" style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                <span className="text-red-400 font-semibold">⚠️ This identity is inactive</span>
              </div>
            )}

            {/* Attestation Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Age Verification */}
              <div className="p-4 rounded-xl" style={{ background: 'rgba(148, 163, 184, 0.05)', border: '1px solid rgba(148, 163, 184, 0.1)' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">Age Verified</span>
                  {result.data.ageVerified ? (
                    <span className="px-2 py-1 rounded-lg text-xs font-semibold" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}>
                      ✓ VERIFIED
                    </span>
                  ) : (
                    <span className="px-2 py-1 rounded-lg text-xs font-semibold" style={{ background: 'rgba(148, 163, 184, 0.2)', color: '#94a3b8' }}>
                      NOT VERIFIED
                    </span>
                  )}
                </div>
                {result.data.ageVerified && result.data.lastAttestationTs > 0 && (
                  <p className="text-xs text-slate-500">
                    Last attestation: {formatDate(result.data.lastAttestationTs)}
                  </p>
                )}
              </div>

              {/* Nationality Verification */}
              <div className="p-4 rounded-xl" style={{ background: 'rgba(148, 163, 184, 0.05)', border: '1px solid rgba(148, 163, 184, 0.1)' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">Nationality Verified</span>
                  {result.data.nationalityVerified ? (
                    <span className="px-2 py-1 rounded-lg text-xs font-semibold" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}>
                      ✓ VERIFIED
                    </span>
                  ) : (
                    <span className="px-2 py-1 rounded-lg text-xs font-semibold" style={{ background: 'rgba(148, 163, 184, 0.2)', color: '#94a3b8' }}>
                      NOT VERIFIED
                    </span>
                  )}
                </div>
                {result.data.nationalityVerified && result.data.lastAttestationTs > 0 && (
                  <p className="text-xs text-slate-500">
                    Last attestation: {formatDate(result.data.lastAttestationTs)}
                  </p>
                )}
              </div>
            </div>

            {/* Additional Details */}
            <div className="mt-6 p-4 rounded-xl" style={{ background: 'rgba(148, 163, 184, 0.05)', border: '1px solid rgba(148, 163, 184, 0.1)' }}>
              <h4 className="text-sm font-medium text-gray-300 mb-3">Identity Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Last Updated</span>
                  <span className="text-white">{formatDate(result.data.lastUpdated)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Reputation Score</span>
                  <span className="text-white">{result.data.reputationScore}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Status</span>
                  <span className={result.data.isActive ? 'text-green-400' : 'text-red-400'}>
                    {result.data.isActive ? '✓ Active' : '✗ Inactive'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Commitment Hash</span>
                  <span className="text-white font-mono text-xs">
                    {result.data.commitmentHash.slice(0, 10)}...{result.data.commitmentHash.slice(-8)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Program ID</span>
                  <span className="text-white font-mono text-xs">
                    {PROGRAM_ID.toString().slice(0, 8)}...{PROGRAM_ID.toString().slice(-8)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* API Documentation */}
        <div className="mt-8 rounded-2xl p-8" style={{ background: '#1a222d', border: '1px solid rgba(148, 163, 184, 0.1)' }}>
          <h3 className="text-xl font-semibold text-white mb-4">🔌 API Integration</h3>
          <p className="text-slate-400 mb-4">
            External services can verify attestations directly on Solana. Here's how to integrate:
          </p>
          
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-800/50">
              <h4 className="text-sm font-medium text-blue-400 mb-2">1. Derive Identity PDA</h4>
              <pre className="text-xs text-gray-300 overflow-x-auto">
{`const [identityPDA] = PublicKey.findProgramAddressSync(
  [Buffer.from('identity'), userPubkey.toBuffer()],
  PROGRAM_ID
);`}
              </pre>
            </div>
            
            <div className="p-4 rounded-xl bg-slate-800/50">
              <h4 className="text-sm font-medium text-blue-400 mb-2">2. Fetch Account Data</h4>
              <pre className="text-xs text-gray-300 overflow-x-auto">
{`const accountInfo = await connection.getAccountInfo(identityPDA);
// Parse the account data to get attestation flags`}
              </pre>
            </div>
            
            <div className="p-4 rounded-xl bg-slate-800/50">
              <h4 className="text-sm font-medium text-blue-400 mb-2">3. Check Attestation Status</h4>
              <pre className="text-xs text-gray-300 overflow-x-auto">
{`// Account data includes:
// - age_verified: bool
// - nationality_verified: bool  
// - is_revoked: bool`}
              </pre>
            </div>
          </div>

          <div className="mt-4 p-4 rounded-xl" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <p className="text-sm text-emerald-300">
              <strong>Program ID:</strong> <code className="font-mono">{PROGRAM_ID.toString()}</code>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 mt-12">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-slate-500 text-sm">
            Zassport — Zero-Knowledge Passport Verification for Network States
          </p>
        </div>
      </footer>
    </div>
  );
}
