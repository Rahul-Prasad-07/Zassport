'use client';

import { useState } from 'react';
import ProposalCreator from '@/components/ProposalCreator';
import VotingDashboard from '@/components/VotingDashboard';
import ReputationLeaderboard from '@/components/ReputationLeaderboard';

export default function GovernancePage() {
  const [activeTab, setActiveTab] = useState<'vote' | 'create' | 'leaderboard'>('vote');
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  const handleConnectWallet = async () => {
    // Mock wallet connection
    // In production, use Solana wallet adapter
    setWalletAddress('7vD2F4K8xN9Xt1BaM3Yp5Wc6Lh4Sg9Rj8Qe2Tn1Zu3V');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900 bg-opacity-50 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🛂</span>
              <div>
                <h1 className="text-2xl font-bold text-white">Zassport Governance</h1>
                <p className="text-sm text-gray-400">Community-driven protocol decisions</p>
              </div>
            </div>

            {walletAddress ? (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs text-gray-400">Connected</p>
                  <p className="text-sm text-white font-mono">
                    {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
                  </p>
                </div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
            ) : (
              <button
                onClick={handleConnectWallet}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="container mx-auto px-4 pt-8">
        <div className="flex gap-2 mb-8 border-b border-gray-700">
          <button
            onClick={() => setActiveTab('vote')}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === 'vote'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            📊 Active Proposals
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === 'create'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            ✏️ Create Proposal
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === 'leaderboard'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            🏆 Leaderboard
          </button>
        </div>

        {/* Content */}
        <div className="pb-12">
          {activeTab === 'vote' && (
            <VotingDashboard walletAddress={walletAddress || undefined} />
          )}
          {activeTab === 'create' && (
            <ProposalCreator walletAddress={walletAddress || undefined} />
          )}
          {activeTab === 'leaderboard' && (
            <ReputationLeaderboard currentAddress={walletAddress || undefined} />
          )}
        </div>
      </div>

      {/* Stats Footer */}
      <div className="container mx-auto px-4 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 bg-opacity-50 rounded-lg p-4 border border-gray-700">
            <div className="text-3xl font-bold text-purple-400">23</div>
            <div className="text-sm text-gray-400">Active Proposals</div>
          </div>
          <div className="bg-gray-800 bg-opacity-50 rounded-lg p-4 border border-gray-700">
            <div className="text-3xl font-bold text-blue-400">1,247</div>
            <div className="text-sm text-gray-400">Total Votes Cast</div>
          </div>
          <div className="bg-gray-800 bg-opacity-50 rounded-lg p-4 border border-gray-700">
            <div className="text-3xl font-bold text-green-400">542</div>
            <div className="text-sm text-gray-400">Community Members</div>
          </div>
          <div className="bg-gray-800 bg-opacity-50 rounded-lg p-4 border border-gray-700">
            <div className="text-3xl font-bold text-yellow-400">89%</div>
            <div className="text-sm text-gray-400">Approval Rate</div>
          </div>
        </div>
      </div>
    </div>
  );
}
