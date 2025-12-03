'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import Link from 'next/link';
import { WalletConnectButton } from "@/components/WalletConnectButton";
import { IdentityRegistration } from "@/components/IdentityRegistration";
import { ZKProofGenerator } from "@/components/ZKProofGenerator";
import { useProgram } from '@/hooks/useProgram';
import { exportAsVerifiablePresentation, exportAsVerifiableCredential } from '@/lib/w3c-export';
import { BiometricGate } from '@/components/BiometricGate';
import { FlowTracker, type FlowStep } from '@/components/FlowTracker';
import { usePassportData } from '@/contexts/PassportDataContext';

interface Claim {
  id: string;
  type: 'age' | 'nationality' | 'sanctions' | 'validity';
  status: 'verified' | 'pending' | 'expired';
  verifiedAt?: Date;
  expiresAt?: Date;
  disclosedTo: string[];
  privacyScore: number;
  details?: any;
}

interface ConsentReceipt {
  claimId: string;
  appId: string;
  appName: string;
  timestamp: Date;
  dataShared: string[];
}

export default function ClaimsWallet() {
  const { publicKey } = useWallet();
  const program = useProgram();
  const { passportData, isRegistered } = usePassportData();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [consents, setConsents] = useState<ConsentReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [privacyScore, setPrivacyScore] = useState(100);
  const [biometricAuthenticated, setBiometricAuthenticated] = useState(false);
  const [showBiometricGate, setShowBiometricGate] = useState(false);
  const [activeTab, setActiveTab] = useState<'generate' | 'claims' | 'history'>('generate');
  const [identityExistsOnChain, setIdentityExistsOnChain] = useState(false);
  const [showPrivacyScore, setShowPrivacyScore] = useState(true);

  // Calculate flow steps based on current state
  const flowSteps: FlowStep[] = [
    {
      id: 'wallet',
      title: 'Connect Wallet',
      description: 'Link your Solana wallet',
      status: publicKey ? 'completed' : 'current',
      icon: '👛',
    },
    {
      id: 'scan',
      title: 'Scan Passport',
      description: 'Extract passport data',
      status: passportData ? 'completed' : publicKey ? 'current' : 'locked',
      icon: '📷',
    },
    {
      id: 'register',
      title: 'Register Identity',
      description: 'Store commitment on-chain',
      status: identityExistsOnChain 
        ? 'completed' 
        : passportData 
        ? 'current' 
        : 'locked',
      icon: '🔐',
    },
    {
      id: 'proof',
      title: 'Generate Proofs',
      description: 'Create ZK proofs',
      status: claims.length > 0 
        ? 'completed' 
        : identityExistsOnChain 
        ? 'current' 
        : 'locked',
      icon: '⚡',
    },
    {
      id: 'verify',
      title: 'Verify On-Chain',
      description: 'Attest your claims',
      status: claims.length > 0 ? 'completed' : 'locked',
      icon: '✅',
    },
  ];

  useEffect(() => {
    if (publicKey && program) {
      fetchClaims();
      fetchConsents();
      checkIdentityExists();
    } else {
      setLoading(false);
    }
  }, [publicKey, program]);

  const checkIdentityExists = async () => {
    if (!program || !publicKey) return;
    try {
      const [identityPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('identity'), publicKey!.toBuffer()],
        program.programId
      );
      const identity = await (program.account as any).identity.fetch(identityPDA);
      if (identity) {
        setIdentityExistsOnChain(true);
      }
    } catch (e) {
      setIdentityExistsOnChain(false);
    }
  };

  const fetchClaims = async () => {
    if (!program || !publicKey) return;
    try {
      const [identityPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('identity'), publicKey!.toBuffer()],
        program.programId
      );

      let identity: any = null;
      try {
        identity = await (program.account as any).identity.fetch(identityPDA);
      } catch (e) {
        // Identity account doesn't exist yet - this is normal for new users
        console.log('No identity account found - user needs to register first');
      }
      
      const fetchedClaims: Claim[] = [];

      if (identity?.ageVerified) {
        const verifiedTime = identity.verifiedAt?.toNumber?.() || Date.now() / 1000;
        fetchedClaims.push({
          id: 'age',
          type: 'age',
          status: 'verified',
          verifiedAt: new Date(verifiedTime * 1000),
          disclosedTo: [],
          privacyScore: 90,
        });
      }

      if (identity?.nationalityVerified) {
        const verifiedTime = identity.verifiedAt?.toNumber?.() || Date.now() / 1000;
        fetchedClaims.push({
          id: 'nationality',
          type: 'nationality',
          status: 'verified',
          verifiedAt: new Date(verifiedTime * 1000),
          disclosedTo: [],
          privacyScore: 85,
        });
      }

      const storedClaims = localStorage.getItem(`claims_${publicKey?.toString()}`);
      if (storedClaims) {
        const parsed = JSON.parse(storedClaims);
        parsed.forEach((c: any) => {
          if ((c.type === 'validity' || c.type === 'sanctions') && c.status === 'verified') {
            fetchedClaims.push({
              ...c,
              verifiedAt: c.verifiedAt ? new Date(c.verifiedAt) : undefined,
              expiresAt: c.expiresAt ? new Date(c.expiresAt) : undefined,
            });
          }
        });
      }

      setClaims(fetchedClaims);
      calculatePrivacyScore(fetchedClaims);
    } catch (error) {
      console.error('Failed to fetch claims:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchConsents = async () => {
    const stored = localStorage.getItem(`consents_${publicKey?.toString()}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      setConsents(parsed.map((c: any) => ({
        ...c,
        timestamp: new Date(c.timestamp),
      })));
    }
  };

  const calculatePrivacyScore = (claims: Claim[]) => {
    let score = 100;
    claims.forEach(claim => {
      score -= claim.disclosedTo.length * 5;
    });
    setPrivacyScore(Math.max(0, score));
  };

  const exportVP = () => {
    if (!publicKey || claims.length === 0) return;
    
    const credentials = claims.map(claim => 
      exportAsVerifiableCredential({
        proof: {},
        publicSignals: [],
        commitment: '',
        nullifier: '',
        owner: publicKey,
        claimType: claim.type as any,
      }, new PublicKey('FR6XtcALdJfPRTLzSyhjt5fJ1eoYsEn8kq4vcGAkd8WQ'))
    );

    const vp = exportAsVerifiablePresentation(
      credentials,
      `did:solana:${publicKey.toString()}`
    );

    const blob = new Blob([JSON.stringify(vp, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zassport-vp-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const shareClaim = async (claimId: string, appId: string, appName: string) => {
    const consent: ConsentReceipt = {
      claimId,
      appId,
      appName,
      timestamp: new Date(),
      dataShared: [claimId],
    };

    const updatedConsents = [...consents, consent];
    setConsents(updatedConsents);
    localStorage.setItem(`consents_${publicKey?.toString()}`, JSON.stringify(updatedConsents));

    setClaims(claims.map(claim => 
      claim.id === claimId
        ? { ...claim, disclosedTo: [...claim.disclosedTo, appName] }
        : claim
    ));
    calculatePrivacyScore(claims);
  };

  const revokeClaim = async (claimId: string, appName: string) => {
    setClaims(claims.map(claim =>
      claim.id === claimId
        ? { ...claim, disclosedTo: claim.disclosedTo.filter(app => app !== appName) }
        : claim
    ));

    const updatedConsents = consents.filter(
      c => !(c.claimId === claimId && c.appName === appName)
    );
    setConsents(updatedConsents);
    localStorage.setItem(`consents_${publicKey?.toString()}`, JSON.stringify(updatedConsents));
  };

  const handleBiometricSuccess = (userId: string) => {
    setBiometricAuthenticated(true);
    setShowBiometricGate(false);
  };

  // Not connected state
  if (!publicKey) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0f14' }}>
        <div className="text-center max-w-md px-6">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(16, 185, 129, 0.15)' }}>
            <svg className="w-8 h-8" style={{ color: '#10b981' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-white mb-3">Connect Your Wallet</h2>
          <p className="text-slate-400 mb-8">Connect a Solana wallet to generate and manage your identity proofs</p>
          <WalletConnectButton />
          <Link href="/" className="block mt-6 text-slate-500 hover:text-slate-300 text-sm transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0f14' }}>
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-t-emerald-500 border-slate-700 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Biometric gate modal
  if (showBiometricGate) {
    return (
      <div className="min-h-screen" style={{ background: '#0a0f14' }}>
        <div className="max-w-md mx-auto px-6 py-20">
          <h2 className="text-2xl font-semibold text-white text-center mb-8">Authenticate to Continue</h2>
          <BiometricGate onAuthSuccess={handleBiometricSuccess} requireAuth={true} />
          <button
            onClick={() => setShowBiometricGate(false)}
            className="mt-6 w-full py-3 rounded-xl text-slate-400 hover:text-white transition-colors"
            style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(148, 163, 184, 0.1)' }}
          >
            Cancel
          </button>
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
              <span className="text-slate-400 text-sm">Dashboard</span>
            </div>

            <div className="flex items-center gap-4">
              {!biometricAuthenticated ? (
                <button
                  onClick={() => setShowBiometricGate(true)}
                  className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.2)' }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                  </svg>
                  Enable Biometric
                </button>
              ) : (
                <span className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#34d399' }}>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Authenticated
                </span>
              )}
              <WalletConnectButton />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Flow Tracker - Compact */}
        <div className="rounded-xl p-4 mb-6" style={{ background: 'rgba(26, 34, 45, 0.5)', border: '1px solid rgba(148, 163, 184, 0.08)' }}>
          <FlowTracker steps={flowSteps} />
        </div>

        {/* Privacy Score Card */}
        <div className="rounded-2xl p-6 mb-8" style={{ background: '#1a222d', border: '1px solid rgba(148, 163, 184, 0.1)' }}>
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setShowPrivacyScore(!showPrivacyScore)}
              className="flex items-center gap-2 group"
              title={showPrivacyScore ? 'Hide privacy score' : 'Show privacy score'}
            >
              <svg
                className={`w-4 h-4 text-slate-400 group-hover:text-white transition-all duration-200 ${
                  showPrivacyScore ? 'rotate-0' : '-rotate-90'
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              <h2 className="text-xl font-semibold text-white group-hover:text-emerald-400 transition-colors">Privacy Score</h2>
            </button>
            <span className="text-2xl font-bold text-white">{privacyScore}</span>
          </div>
          
          <div
            className={`transition-all duration-300 ease-in-out overflow-hidden ${
              showPrivacyScore ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 pt-2">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <svg className="w-24 h-24 transform -rotate-90">
                    <circle cx="48" cy="48" r="40" stroke="rgba(148, 163, 184, 0.1)" strokeWidth="8" fill="none" />
                    <circle 
                      cx="48" cy="48" r="40" 
                      stroke="url(#scoreGradient)" 
                      strokeWidth="8" 
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={`${privacyScore * 2.51} 251`}
                    />
                    <defs>
                      <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#3b82f6" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">{privacyScore}</span>
                  </div>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">
                    {privacyScore >= 80 && 'Excellent — Your data exposure is minimal'}
                    {privacyScore >= 50 && privacyScore < 80 && 'Good — Moderate data sharing detected'}
                    {privacyScore < 50 && 'Attention needed — Consider revoking some access'}
                  </p>
                  <p className="text-slate-500 text-xs mt-2">Based on {claims.length} claim(s) shared</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={exportVP}
                  disabled={claims.length === 0}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.2)' }}
                >
                  Export Credentials
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 p-1 rounded-xl mb-8" style={{ background: '#1a222d' }}>
          {[
            { id: 'generate', label: 'Generate Proofs', icon: 'M12 6v6m0 0v6m0-6h6m-6 0H6' },
            { id: 'claims', label: 'My Claims', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
            { id: 'history', label: 'Consent History', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id ? 'text-white' : 'text-slate-400 hover:text-white'
              }`}
              style={{ 
                background: activeTab === tab.id ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
              </svg>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'generate' && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Identity Registration */}
            <div className="rounded-2xl p-6" style={{ background: '#1a222d', border: '1px solid rgba(148, 163, 184, 0.1)' }}>
              <IdentityRegistration />
            </div>

            {/* ZK Proof Generator */}
            <div className="rounded-2xl p-6" style={{ background: '#1a222d', border: '1px solid rgba(148, 163, 184, 0.1)' }}>
              <ZKProofGenerator />
            </div>
          </div>
        )}

        {activeTab === 'claims' && (
          <div>
            {claims.length === 0 ? (
              <div className="text-center py-16 rounded-2xl" style={{ background: '#1a222d', border: '1px solid rgba(148, 163, 184, 0.1)' }}>
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(148, 163, 184, 0.1)' }}>
                  <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-white mb-2">No Claims Yet</h3>
                <p className="text-slate-400 mb-6">Generate your first proof to create a verified claim</p>
                <button
                  onClick={() => setActiveTab('generate')}
                  className="px-6 py-3 rounded-xl font-medium text-white transition-all"
                  style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
                >
                  Generate Proof
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {claims.map(claim => (
                  <ClaimCard
                    key={claim.id}
                    claim={claim}
                    onShare={shareClaim}
                    onRevoke={revokeClaim}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="rounded-2xl" style={{ background: '#1a222d', border: '1px solid rgba(148, 163, 184, 0.1)' }}>
            {consents.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(148, 163, 184, 0.1)' }}>
                  <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-white mb-2">No History</h3>
                <p className="text-slate-400">You haven&apos;t shared any claims yet</p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: 'rgba(148, 163, 184, 0.1)' }}>
                {consents.map((consent, index) => (
                  <div key={index} className="flex items-center justify-between p-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(59, 130, 246, 0.15)' }}>
                        <svg className="w-5 h-5" style={{ color: '#3b82f6' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-white">{consent.appName}</p>
                        <p className="text-sm text-slate-400">
                          {consent.dataShared.join(', ')} • {consent.timestamp.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => revokeClaim(consent.claimId, consent.appName)}
                      className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171' }}
                    >
                      Revoke
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function ClaimCard({
  claim,
  onShare,
  onRevoke,
}: {
  claim: Claim;
  onShare: (claimId: string, appId: string, appName: string) => void;
  onRevoke: (claimId: string, appName: string) => void;
}) {
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [appName, setAppName] = useState('');

  const getClaimConfig = (type: string) => {
    switch (type) {
      case 'age': return { icon: '👤', label: 'Age Verified', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' };
      case 'nationality': return { icon: '🌍', label: 'Nationality', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' };
      case 'sanctions': return { icon: '✓', label: 'Sanctions Clear', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' };
      case 'validity': return { icon: '📋', label: 'Valid Passport', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.15)' };
      default: return { icon: '📄', label: 'Claim', color: '#64748b', bg: 'rgba(100, 116, 139, 0.15)' };
    }
  };

  const config = getClaimConfig(claim.type);

  return (
    <div className="rounded-2xl p-6" style={{ background: '#1a222d', border: '1px solid rgba(148, 163, 184, 0.1)' }}>
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: config.bg }}>
          {config.icon}
        </div>
        <span 
          className="px-3 py-1 rounded-full text-xs font-medium"
          style={{ 
            background: claim.status === 'verified' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
            color: claim.status === 'verified' ? '#34d399' : '#fbbf24'
          }}
        >
          {claim.status}
        </span>
      </div>

      <h3 className="text-lg font-semibold text-white mb-1">{config.label}</h3>
      {claim.verifiedAt && (
        <p className="text-sm text-slate-400 mb-4">
          Verified {claim.verifiedAt.toLocaleDateString()}
        </p>
      )}

      {claim.disclosedTo.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-slate-500 mb-2">Shared with:</p>
          <div className="flex flex-wrap gap-2">
            {claim.disclosedTo.map(app => (
              <span key={app} className="px-2 py-1 rounded text-xs" style={{ background: 'rgba(148, 163, 184, 0.1)', color: '#94a3b8' }}>
                {app}
              </span>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => setShowShareDialog(true)}
        className="w-full py-2.5 rounded-xl text-sm font-medium transition-all"
        style={{ background: config.bg, color: config.color }}
      >
        Share Claim
      </button>

      {/* Share Dialog */}
      {showShareDialog && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl p-6 max-w-md w-full" style={{ background: '#1a222d', border: '1px solid rgba(148, 163, 184, 0.2)' }}>
            <h3 className="text-xl font-semibold text-white mb-4">Share {config.label}</h3>
            <input
              type="text"
              placeholder="App or service name"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl mb-4 text-white"
              style={{ background: '#0f1419', border: '1px solid rgba(148, 163, 184, 0.2)' }}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowShareDialog(false)}
                className="flex-1 py-3 rounded-xl text-slate-400 font-medium"
                style={{ background: 'rgba(148, 163, 184, 0.1)' }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (appName.trim()) {
                    onShare(claim.id, appName.toLowerCase().replace(/\s+/g, '-'), appName);
                    setShowShareDialog(false);
                    setAppName('');
                  }
                }}
                className="flex-1 py-3 rounded-xl font-medium text-white"
                style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
              >
                Share
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
