'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletConnectButton } from "@/components/WalletConnectButton";
import { BiometricGate } from '@/components/BiometricGate';

interface Guardian {
  address: string;
  name: string;
  addedAt: Date;
  status: 'active' | 'pending';
}

export default function RecoveryPage() {
  const { publicKey } = useWallet();
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [newGuardianAddress, setNewGuardianAddress] = useState('');
  const [newGuardianName, setNewGuardianName] = useState('');
  const [showAddGuardian, setShowAddGuardian] = useState(false);
  const [biometricVerified, setBiometricVerified] = useState(false);

  const addGuardian = () => {
    if (newGuardianAddress && newGuardianName) {
      setGuardians([...guardians, {
        address: newGuardianAddress,
        name: newGuardianName,
        addedAt: new Date(),
        status: 'pending'
      }]);
      setNewGuardianAddress('');
      setNewGuardianName('');
      setShowAddGuardian(false);
    }
  };

  const removeGuardian = (address: string) => {
    setGuardians(guardians.filter(g => g.address !== address));
  };

  if (!publicKey) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0f14' }}>
        <div className="text-center max-w-md px-6">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(168, 85, 247, 0.15)' }}>
            <svg className="w-8 h-8" style={{ color: '#a855f7' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-white mb-3">Connect Your Wallet</h2>
          <p className="text-slate-400 mb-8">Connect your wallet to manage social recovery guardians</p>
          <WalletConnectButton />
          <Link href="/" className="block mt-6 text-slate-500 hover:text-slate-300 text-sm transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

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
              <span className="text-slate-400 text-sm">Social Recovery</span>
            </div>
            <WalletConnectButton />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Page Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6" style={{ background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
            <svg className="w-4 h-4" style={{ color: '#a855f7' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span className="text-sm font-medium" style={{ color: '#c084fc' }}>3-of-5 Threshold</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Social Recovery
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Set up trusted guardians to recover your identity if you lose access to your wallet
          </p>
        </div>

        {/* Biometric Verification */}
        {!biometricVerified && (
          <div className="rounded-2xl p-6 mb-8" style={{ background: '#1a222d', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(168, 85, 247, 0.15)' }}>
                <svg className="w-6 h-6" style={{ color: '#a855f7' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Biometric Verification Required</h3>
                <p className="text-slate-400 text-sm">Authenticate with biometrics to manage guardians</p>
              </div>
            </div>
            <BiometricGate 
              onAuthSuccess={() => setBiometricVerified(true)}
              requireAuth={true}
            />
          </div>
        )}

        {/* Guardians Status */}
        <div className="rounded-2xl p-6 mb-8" style={{ background: '#1a222d', border: '1px solid rgba(148, 163, 184, 0.1)' }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-white">Your Guardians</h2>
              <p className="text-slate-400 text-sm">{guardians.length} of 5 guardians configured</p>
            </div>
            <button
              onClick={() => setShowAddGuardian(true)}
              disabled={guardians.length >= 5 || !biometricVerified}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white' }}
            >
              Add Guardian
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-xs text-slate-500 mb-2">
              <span>Setup Progress</span>
              <span>{guardians.length}/5</span>
            </div>
            <div className="h-2 rounded-full" style={{ background: 'rgba(148, 163, 184, 0.1)' }}>
              <div 
                className="h-2 rounded-full transition-all"
                style={{ 
                  width: `${(guardians.length / 5) * 100}%`,
                  background: 'linear-gradient(135deg, #10b981, #3b82f6)'
                }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {guardians.length < 3 
                ? `Add ${3 - guardians.length} more guardians to enable recovery` 
                : '✓ Recovery is enabled with 3-of-5 threshold'}
            </p>
          </div>

          {/* Guardian List */}
          {guardians.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(148, 163, 184, 0.1)' }}>
                <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No Guardians Yet</h3>
              <p className="text-slate-400 text-sm">Add trusted contacts as guardians to enable recovery</p>
            </div>
          ) : (
            <div className="space-y-3">
              {guardians.map((guardian, index) => (
                <div 
                  key={guardian.address}
                  className="flex items-center justify-between p-4 rounded-xl"
                  style={{ background: '#0f1419' }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-medium" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                      {guardian.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white font-medium">{guardian.name}</p>
                      <p className="text-slate-500 text-xs font-mono">
                        {guardian.address.slice(0, 8)}...{guardian.address.slice(-6)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span 
                      className="px-2 py-1 rounded text-xs font-medium"
                      style={{ 
                        background: guardian.status === 'active' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: guardian.status === 'active' ? '#34d399' : '#fbbf24'
                      }}
                    >
                      {guardian.status}
                    </span>
                    <button
                      onClick={() => removeGuardian(guardian.address)}
                      disabled={!biometricVerified}
                      className="p-2 rounded-lg transition-colors disabled:opacity-40"
                      style={{ color: '#ef4444' }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* How It Works */}
        <div className="rounded-2xl p-6" style={{ background: '#1a222d', border: '1px solid rgba(148, 163, 184, 0.1)' }}>
          <h3 className="text-lg font-semibold text-white mb-6">How Social Recovery Works</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 text-lg font-bold" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>1</div>
              <h4 className="text-white font-medium mb-1">Setup Guardians</h4>
              <p className="text-slate-400 text-sm">Add 5 trusted contacts as guardians to your account</p>
            </div>
            <div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 text-lg font-bold" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>2</div>
              <h4 className="text-white font-medium mb-1">Initiate Recovery</h4>
              <p className="text-slate-400 text-sm">If access is lost, request recovery from a new wallet</p>
            </div>
            <div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 text-lg font-bold" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' }}>3</div>
              <h4 className="text-white font-medium mb-1">Guardian Approval</h4>
              <p className="text-slate-400 text-sm">3 of 5 guardians approve to restore your identity</p>
            </div>
          </div>
        </div>
      </main>

      {/* Add Guardian Modal */}
      {showAddGuardian && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl p-6 max-w-md w-full" style={{ background: '#1a222d', border: '1px solid rgba(148, 163, 184, 0.2)' }}>
            <h3 className="text-xl font-semibold text-white mb-6">Add Guardian</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Guardian Name</label>
                <input
                  type="text"
                  placeholder="e.g., Alice"
                  value={newGuardianName}
                  onChange={(e) => setNewGuardianName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-white"
                  style={{ background: '#0f1419', border: '1px solid rgba(148, 163, 184, 0.2)' }}
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Wallet Address</label>
                <input
                  type="text"
                  placeholder="Solana wallet address"
                  value={newGuardianAddress}
                  onChange={(e) => setNewGuardianAddress(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-white font-mono text-sm"
                  style={{ background: '#0f1419', border: '1px solid rgba(148, 163, 184, 0.2)' }}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddGuardian(false)}
                className="flex-1 py-3 rounded-xl text-slate-400 font-medium"
                style={{ background: 'rgba(148, 163, 184, 0.1)' }}
              >
                Cancel
              </button>
              <button
                onClick={addGuardian}
                disabled={!newGuardianAddress || !newGuardianName}
                className="flex-1 py-3 rounded-xl font-medium text-white disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
              >
                Add Guardian
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
