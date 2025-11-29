'use client';

import React from 'react';
import { WalletConnectButton } from "@/components/WalletConnectButton";
import { IdentityRegistration } from "@/components/IdentityRegistration";
import { ZKProofGenerator } from "@/components/ZKProofGenerator";
import { DebugInfo } from "@/components/DebugInfo";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900">
      {/* Header */}
      <header className="bg-black/30 backdrop-blur-lg shadow-lg border-b border-purple-500/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-white">🛂 Zassport</h1>
              <span className="ml-3 text-sm text-purple-300">Privacy-Preserving ZK Identity</span>
            </div>
            <WalletConnectButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-6">
            <span className="text-sm font-medium text-purple-300">🔐 Privacy-First Identity</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Verify Identity with
            <span className="block bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Zero Knowledge
            </span>
          </h2>
          <p className="text-lg md:text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
            Prove passport attributes like age and nationality without revealing personal data.
            Built on Solana for lightning-fast, privacy-preserving verification.
          </p>
          <div className="flex justify-center mt-8 space-x-4">
            <div className="flex items-center text-sm text-gray-400">
              <svg className="w-5 h-5 mr-2 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              ZK Proofs
            </div>
            <div className="flex items-center text-sm text-gray-400">
              <svg className="w-5 h-5 mr-2 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
              Solana Powered
            </div>
            <div className="flex items-center text-sm text-gray-400">
              <svg className="w-5 h-5 mr-2 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Privacy Protected
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 mb-20">
          {/* Identity Registration Component */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/10 hover:border-purple-400/30 transition-all duration-500 hover:shadow-purple-500/10">
            <IdentityRegistration />
          </div>

          {/* ZK Proof Generator */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/10 hover:border-blue-400/30 transition-all duration-500 hover:shadow-blue-500/10">
            <ZKProofGenerator />
          </div>
        </div>

        {/* Features Section */}
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-white mb-4">Why Choose Zassport?</h3>
          <p className="text-gray-400 max-w-2xl mx-auto">Advanced privacy technology meets seamless user experience</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl shadow-xl p-8 text-center border border-white/10 hover:border-purple-400/30 transition-all duration-500 hover:shadow-purple-500/10 group">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h4 className="text-xl font-semibold text-white mb-3">Zero-Knowledge Proofs</h4>
            <p className="text-gray-400 leading-relaxed">Prove identity attributes without revealing sensitive data. Mathematical guarantees of privacy.</p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl rounded-2xl shadow-xl p-8 text-center border border-white/10 hover:border-blue-400/30 transition-all duration-500 hover:shadow-blue-500/10 group">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h4 className="text-xl font-semibold text-white mb-3">Lightning Fast</h4>
            <p className="text-gray-400 leading-relaxed">Built on Solana for sub-second transactions and instant verification.</p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl rounded-2xl shadow-xl p-8 text-center border border-white/10 hover:border-cyan-400/30 transition-all duration-500 hover:shadow-cyan-500/10 group">
            <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <h4 className="text-xl font-semibold text-white mb-3">Community Governance</h4>
            <p className="text-gray-400 leading-relaxed">Participate in decentralized decision-making with privacy-preserving voting.</p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-20 bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
          <h3 className="text-2xl font-bold text-white text-center mb-8">Network Overview</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400 mb-2">∞</div>
              <div className="text-sm text-gray-400 uppercase tracking-wide">Privacy Level</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">&lt;1s</div>
              <div className="text-sm text-gray-400 uppercase tracking-wide">Verification Time</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-cyan-400 mb-2">150+</div>
              <div className="text-sm text-gray-400 uppercase tracking-wide">Countries Supported</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">ZK</div>
              <div className="text-sm text-gray-400 uppercase tracking-wide">Proof Technology</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-20 pt-8 border-t border-white/10">
          <div className="text-center">
            <p className="text-gray-400 text-sm">
              Built for the Z-Cash Hackathon • Network School Privacy Challenge
            </p>
            <p className="text-gray-500 text-xs mt-2">
              © 2025 Zassport • Privacy-preserving identity on Solana
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
