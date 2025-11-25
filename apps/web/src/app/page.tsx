'use client';

import { WalletConnectButton } from "@/components/WalletConnectButton";
import { IdentityRegistration } from "@/components/IdentityRegistration";
import { ZKProofGenerator } from "@/components/ZKProofGenerator";

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
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold text-white mb-4 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Verify Your Identity Without Revealing Personal Data
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Use zero-knowledge proofs to prove passport attributes like age and nationality
            without exposing your personal information. Built on Solana for speed and privacy.
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {/* Identity Registration Component */}
          <div className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 backdrop-blur-lg rounded-xl shadow-2xl p-8 border border-purple-500/30">
            <IdentityRegistration />
          </div>

          {/* ZK Proof Generator */}
          <ZKProofGenerator />
        </div>

        {/* Features Section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 backdrop-blur-lg rounded-xl shadow-xl p-6 text-center border border-purple-500/30 hover:border-purple-400/50 transition-all duration-300 transform hover:scale-105">
            <div className="w-12 h-12 bg-purple-500/30 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Privacy First</h3>
            <p className="text-gray-300">Zero-knowledge proofs ensure your personal data stays private while proving validity.</p>
          </div>

          <div className="bg-gradient-to-br from-green-900/40 to-blue-900/40 backdrop-blur-lg rounded-xl shadow-xl p-6 text-center border border-green-500/30 hover:border-green-400/50 transition-all duration-300 transform hover:scale-105">
            <div className="w-12 h-12 bg-green-500/30 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Lightning Fast</h3>
            <p className="text-gray-300">Built on Solana for sub-second verification and minimal transaction costs.</p>
          </div>

          <div className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 backdrop-blur-lg rounded-xl shadow-xl p-6 text-center border border-blue-500/30 hover:border-blue-400/50 transition-all duration-300 transform hover:scale-105">
            <div className="w-12 h-12 bg-blue-500/30 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Decentralized</h3>
            <p className="text-gray-300">No central authority controls your identity - you own your data and reputation.</p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-16 bg-gradient-to-r from-purple-900/40 to-blue-900/40 backdrop-blur-lg rounded-xl p-8 border border-purple-500/30">
          <h3 className="text-2xl font-bold text-white text-center mb-8">Network Stats</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-400">3</div>
              <div className="text-sm text-gray-400 mt-1">ZK Circuits</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-400">100%</div>
              <div className="text-sm text-gray-400 mt-1">Privacy</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-400">&lt;1s</div>
              <div className="text-sm text-gray-400 mt-1">Verification Time</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-yellow-400">Solana</div>
              <div className="text-sm text-gray-400 mt-1">Blockchain</div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-20 py-8 border-t border-purple-500/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-400">
          <p>Built for Network School Zcash Hackathon 2025</p>
          <p className="text-sm mt-2">Privacy-Preserving Identity • Zero-Knowledge Proofs • Solana Blockchain</p>
        </div>
      </footer>
    </div>
  );
}
