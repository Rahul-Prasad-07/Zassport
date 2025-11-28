'use client';

import { useState, useEffect } from 'react';
import { useProgram } from '@/hooks/useProgram';

interface Identity {
  address: string;
  reputation: number;
  verifiedAt: number;
  proofsGenerated: number;
  votesCast: number;
}

interface ReputationLeaderboardProps {
  currentAddress?: string;
}

export default function ReputationLeaderboard({ currentAddress }: ReputationLeaderboardProps) {
  const program = useProgram();
  const [identities, setIdentities] = useState<Identity[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);

  // Mock data for demonstration
  const mockIdentities: Identity[] = [
    {
      address: '7vD2F4K8xN9Xt1BaM3Yp5Wc6Lh4Sg9Rj8Qe2Tn1Zu3V',
      reputation: 985,
      verifiedAt: Date.now() - 45 * 24 * 60 * 60 * 1000,
      proofsGenerated: 127,
      votesCast: 42,
    },
    {
      address: '8wE3G5L9yO0Yu2CbN4Zq6Xd7Mi5Th0Sk9Rf3Uo2Av4W',
      reputation: 847,
      verifiedAt: Date.now() - 38 * 24 * 60 * 60 * 1000,
      proofsGenerated: 95,
      votesCast: 38,
    },
    {
      address: '9xF4H6M0zP1Zv3DcO5Ar7Ye8Nj6Ui1Tl0Sg4Vp3Bw5X',
      reputation: 763,
      verifiedAt: Date.now() - 52 * 24 * 60 * 60 * 1000,
      proofsGenerated: 84,
      votesCast: 35,
    },
    {
      address: '5tC1E2D3yK4Av5FdL6Bs8Zf9Oh7Pk2Qm3Rh5Wq4Cx6Y',
      reputation: 692,
      verifiedAt: Date.now() - 28 * 24 * 60 * 60 * 1000,
      proofsGenerated: 71,
      votesCast: 29,
    },
    {
      address: '6uD2F3E4zL5Bw6GdM7Ct9Ag0Pi8Ql3Rn4Si6Xr5Dy7Z',
      reputation: 618,
      verifiedAt: Date.now() - 34 * 24 * 60 * 60 * 1000,
      proofsGenerated: 63,
      votesCast: 26,
    },
  ];

  useEffect(() => {
    loadLeaderboard();
  }, [program]);

  const loadLeaderboard = async () => {
    if (!program) {
      setIdentities([]);
      return;
    }

    setLoading(true);
    try {
      // Fetch all identities and reputation records
      const [identityAccounts, reputationAccounts] = await Promise.all([
        (program.account as any).Identity.all(),
        (program.account as any).ReputationRecord.all(),
      ]);

      // Create a map of reputation by identity pubkey
      const reputationMap = new Map<string, any>();
      reputationAccounts.forEach((rep: any) => {
        reputationMap.set(rep.account.identity.toString(), rep.account);
      });

      // Combine data
      const combinedIdentities: Identity[] = identityAccounts.map((identityAcc: any) => {
        const identity = identityAcc.account;
        const reputation = reputationMap.get(identityAcc.publicKey.toString());
        return {
          address: identity.owner.toString(),
          reputation: reputation ? reputation.score.toNumber() : identity.reputation_score.toNumber(),
          verifiedAt: identity.last_updated.toNumber() * 1000,
          proofsGenerated: reputation ? reputation.contributions.toNumber() : 0,
          votesCast: 0, // Not stored, placeholder
        };
      });

      // Sort by reputation descending
      const sorted = combinedIdentities.sort((a, b) => b.reputation - a.reputation);
      setIdentities(sorted);

      // Find current user's rank
      if (currentAddress) {
        const rank = sorted.findIndex(id => id.address === currentAddress);
        setCurrentUserRank(rank >= 0 ? rank + 1 : null);
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      setIdentities([]);
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const formatDate = (timestamp: number) => {
    const days = Math.floor((Date.now() - timestamp) / (24 * 60 * 60 * 1000));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  };

  const getRankEmoji = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const getReputationColor = (reputation: number) => {
    if (reputation >= 900) return 'text-yellow-400';
    if (reputation >= 700) return 'text-purple-400';
    if (reputation >= 500) return 'text-blue-400';
    if (reputation >= 300) return 'text-green-400';
    return 'text-gray-400';
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Reputation Leaderboard</h2>
        <button
          onClick={loadLeaderboard}
          disabled={loading}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 text-white rounded-lg transition-colors text-sm"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {currentUserRank && (
        <div className="mb-4 p-4 bg-purple-900 bg-opacity-30 border border-purple-700 rounded-lg">
          <p className="text-purple-300 text-sm">
            <span className="font-semibold">Your Rank:</span> #{currentUserRank} with{' '}
            {identities.find(id => id.address === currentAddress)?.reputation || 0} reputation
          </p>
        </div>
      )}

      {loading && identities.length === 0 ? (
        <div className="text-center text-gray-400 py-8">Loading leaderboard...</div>
      ) : identities.length === 0 ? (
        <div className="text-center text-gray-400 py-8">No identities found</div>
      ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-12 gap-4 px-4 py-2 text-sm font-medium text-gray-400 border-b border-gray-700">
            <div className="col-span-1">Rank</div>
            <div className="col-span-4">Address</div>
            <div className="col-span-2">Reputation</div>
            <div className="col-span-2">Proofs</div>
            <div className="col-span-3">Member Since</div>
          </div>

          {identities.map((identity, index) => {
            const isCurrentUser = identity.address === currentAddress;
            
            return (
              <div
                key={identity.address}
                className={`grid grid-cols-12 gap-4 px-4 py-3 rounded-lg transition-colors ${
                  isCurrentUser
                    ? 'bg-purple-900 bg-opacity-30 border border-purple-700'
                    : 'bg-gray-900 hover:bg-gray-850'
                }`}
              >
                <div className="col-span-1 flex items-center">
                  <span className="text-lg font-bold text-gray-300">
                    {getRankEmoji(index + 1)}
                  </span>
                </div>

                <div className="col-span-4 flex items-center">
                  <span className="text-white font-mono text-sm">
                    {formatAddress(identity.address)}
                  </span>
                  {isCurrentUser && (
                    <span className="ml-2 text-xs bg-purple-600 text-white px-2 py-0.5 rounded">
                      You
                    </span>
                  )}
                </div>

                <div className="col-span-2 flex items-center">
                  <span className={`font-bold text-lg ${getReputationColor(identity.reputation)}`}>
                    {identity.reputation}
                  </span>
                </div>

                <div className="col-span-2 flex items-center">
                  <div className="text-sm">
                    <div className="text-gray-300">{identity.proofsGenerated} generated</div>
                    <div className="text-gray-500 text-xs">{identity.votesCast} votes</div>
                  </div>
                </div>

                <div className="col-span-3 flex items-center">
                  <span className="text-sm text-gray-400">
                    {formatDate(identity.verifiedAt)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6 p-4 bg-gray-900 rounded-lg border border-gray-700">
        <h3 className="text-sm font-semibold text-white mb-2">How Reputation Works</h3>
        <ul className="text-sm text-gray-400 space-y-1">
          <li>• Generate ZK proofs: +10 reputation per proof</li>
          <li>• Vote on proposals: +5 reputation per vote</li>
          <li>• Create passed proposals: +50 reputation</li>
          <li>• High reputation gives more voting power in governance</li>
        </ul>
      </div>
    </div>
  );
}
