'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletConnectButton } from "@/components/WalletConnectButton";
import { CrossChainBridgeUI } from '@/components/CrossChainBridgeUI';

const SUPPORTED_CHAINS = [
  { id: 'ethereum', name: 'Ethereum', icon: '⟠', color: '#627eea' },
  { id: 'polygon', name: 'Polygon', icon: '⬡', color: '#8247e5' },
  { id: 'arbitrum', name: 'Arbitrum', icon: '🔵', color: '#28a0f0' },
  { id: 'optimism', name: 'Optimism', icon: '🔴', color: '#ff0420' },
  { id: 'avalanche', name: 'Avalanche', icon: '🔺', color: '#e84142' },
  { id: 'bsc', name: 'BNB Chain', icon: '⛓', color: '#f3ba2f' },
];

export default function BridgePage() {
  const { publicKey } = useWallet();
  const [selectedChain, setSelectedChain] = useState<string | null>(null);

  if (!publicKey) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0f14' }}>
        <div className="text-center max-w-md px-6">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(59, 130, 246, 0.15)' }}>
            <svg className="w-8 h-8" style={{ color: '#3b82f6' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-white mb-3">Connect Your Wallet</h2>
          <p className="text-slate-400 mb-8">Connect your wallet to bridge attestations to other chains</p>
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
              <span className="text-slate-400 text-sm">Cross-Chain Bridge</span>
            </div>
            <WalletConnectButton />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Page Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6" style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
            <svg className="w-4 h-4" style={{ color: '#3b82f6' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            <span className="text-sm font-medium" style={{ color: '#60a5fa' }}>Powered by Wormhole</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Cross-Chain Bridge
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Bridge your verified attestations from Solana to other supported chains
          </p>
        </div>

        {/* Chain Selection */}
        <div className="rounded-2xl p-6 mb-8" style={{ background: '#1a222d', border: '1px solid rgba(148, 163, 184, 0.1)' }}>
          <h2 className="text-lg font-semibold text-white mb-4">Select Destination Chain</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {SUPPORTED_CHAINS.map(chain => (
              <button
                key={chain.id}
                onClick={() => setSelectedChain(chain.id)}
                className="p-4 rounded-xl text-center transition-all"
                style={{ 
                  background: selectedChain === chain.id ? `${chain.color}20` : 'rgba(148, 163, 184, 0.05)',
                  border: selectedChain === chain.id ? `2px solid ${chain.color}` : '2px solid transparent'
                }}
              >
                <div className="text-2xl mb-2">{chain.icon}</div>
                <div className="text-sm font-medium text-white">{chain.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Bridge Interface */}
        <div className="rounded-2xl p-6" style={{ background: '#1a222d', border: '1px solid rgba(148, 163, 184, 0.1)' }}>
          <CrossChainBridgeUI 
            claims={[]}
            onBridgeComplete={(txHash) => {
              console.log('Bridge complete:', txHash);
            }}
          />
        </div>

        {/* Info Section */}
        <div className="mt-8 grid md:grid-cols-3 gap-6">
          <div className="rounded-xl p-5" style={{ background: '#1a222d', border: '1px solid rgba(148, 163, 184, 0.1)' }}>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: 'rgba(16, 185, 129, 0.15)' }}>
              <svg className="w-5 h-5" style={{ color: '#10b981' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-white font-medium mb-1">Secure Transfer</h3>
            <p className="text-slate-400 text-sm">Attestations are verified by Wormhole guardians before bridging</p>
          </div>
          <div className="rounded-xl p-5" style={{ background: '#1a222d', border: '1px solid rgba(148, 163, 184, 0.1)' }}>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: 'rgba(59, 130, 246, 0.15)' }}>
              <svg className="w-5 h-5" style={{ color: '#3b82f6' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-white font-medium mb-1">~15 Min Transfer</h3>
            <p className="text-slate-400 text-sm">Cross-chain transfers typically complete within 15-20 minutes</p>
          </div>
          <div className="rounded-xl p-5" style={{ background: '#1a222d', border: '1px solid rgba(148, 163, 184, 0.1)' }}>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: 'rgba(168, 85, 247, 0.15)' }}>
              <svg className="w-5 h-5" style={{ color: '#a855f7' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
              </svg>
            </div>
            <h3 className="text-white font-medium mb-1">Gas Efficient</h3>
            <p className="text-slate-400 text-sm">Optimized contracts minimize gas costs on destination chains</p>
          </div>
        </div>
      </main>
    </div>
  );
}
