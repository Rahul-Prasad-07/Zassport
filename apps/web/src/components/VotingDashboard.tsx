'use client';

import { useState, useEffect } from 'react';
import * as anchor from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { useProgram } from '@/hooks/useProgram';

interface Proposal {
  id: number;
  title: string;
  description: string;
  proposer: string;
  options: string[];
  votes: number[];
  totalVotes: number;
  startTime: number;
  endTime: number;
  status: 'active' | 'passed' | 'rejected' | 'expired';
}

interface VotingDashboardProps {
  walletAddress?: string;
}

export default function VotingDashboard({ walletAddress }: VotingDashboardProps) {
  const program = useProgram();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<number | null>(null);
  const [selectedOption, setSelectedOption] = useState<number>(0);

  // Mock data for demonstration
  const mockProposals: Proposal[] = [
    {
      id: 1,
      title: 'Add Switzerland to Approved Countries List',
      description: 'Proposal to add Switzerland (CHE) to the list of approved countries for identity verification. This will allow Swiss passport holders to participate in the protocol.',
      proposer: '7vD2F4...Zu3V',
      options: ['Approve', 'Reject', 'Abstain'],
      votes: [45, 12, 8],
      totalVotes: 65,
      startTime: Date.now() - 2 * 24 * 60 * 60 * 1000,
      endTime: Date.now() + 5 * 24 * 60 * 60 * 1000,
      status: 'active',
    },
    {
      id: 2,
      title: 'Increase Minimum Reputation for Proposal Creation',
      description: 'Increase the minimum reputation score required to create governance proposals from 10 to 50. This will help prevent spam proposals.',
      proposer: '8wE3G5...Xv4W',
      options: ['Increase to 50', 'Increase to 30', 'Keep at 10'],
      votes: [23, 34, 18],
      totalVotes: 75,
      startTime: Date.now() - 4 * 24 * 60 * 60 * 1000,
      endTime: Date.now() + 3 * 24 * 60 * 60 * 1000,
      status: 'active',
    },
    {
      id: 3,
      title: 'Add Age Proof Feature for 21+ Verification',
      description: 'Implement a new ZK circuit to verify users are 21 or older, in addition to the existing 18+ circuit.',
      proposer: '9xF4H6...Yw5X',
      options: ['Approve', 'Reject'],
      votes: [58, 15],
      totalVotes: 73,
      startTime: Date.now() - 8 * 24 * 60 * 60 * 1000,
      endTime: Date.now() - 1 * 24 * 60 * 60 * 1000,
      status: 'passed',
    },
  ];

  useEffect(() => {
    loadProposals();
  }, [program]);

  const loadProposals = async () => {
    if (!program) {
      setProposals([]);
      return;
    }

    setLoading(true);
    try {
      const proposalAccounts = await (program.account as any).GovernanceProposal.all();
      const formattedProposals: Proposal[] = proposalAccounts.map((account: any) => {
        const data = account.account;
        const now = Date.now() / 1000;
        const status: 'active' | 'passed' | 'rejected' | 'expired' =
          data.executed ? 'passed' :
          now > data.votingEnds.toNumber() ? 'expired' :
          data.yesVotes > data.noVotes ? 'passed' : 'active';

        return {
          id: data.id.toNumber(),
          title: data.title,
          description: data.description,
          proposer: data.creator.toString(),
          options: ['Yes', 'No'],
          votes: [data.yesVotes.toNumber(), data.noVotes.toNumber()],
          totalVotes: data.yesVotes.toNumber() + data.noVotes.toNumber(),
          startTime: data.createdAt.toNumber() * 1000,
          endTime: data.votingEnds.toNumber() * 1000,
          status,
        };
      });
      setProposals(formattedProposals);
    } catch (error) {
      console.error('Error loading proposals:', error);
      setProposals([]);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (proposalId: number, optionIndex: number) => {
    if (!program || !walletAddress) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      const voteType = optionIndex === 0 ? { yes: {} } : { no: {} };

      // Call cast_vote instruction
      const tx = await program.methods
        .castVote(new anchor.BN(proposalId), voteType)
        .rpc();

      alert('Vote cast successfully! TX: ' + tx);
      loadProposals();
    } catch (error) {
      console.error('Error casting vote:', error);
      alert('Failed to cast vote: ' + (error as Error).message);
    }
  };

  const getTimeRemaining = (endTime: number) => {
    const diff = endTime - Date.now();
    if (diff <= 0) return 'Ended';
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    return `${days}d ${hours}h remaining`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-600';
      case 'passed': return 'bg-blue-600';
      case 'rejected': return 'bg-red-600';
      case 'expired': return 'bg-gray-600';
      default: return 'bg-gray-600';
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Governance Proposals</h2>
        <button
          onClick={loadProposals}
          disabled={loading}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 text-white rounded-lg transition-colors text-sm"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {loading && proposals.length === 0 ? (
        <div className="text-center text-gray-400 py-8">Loading proposals...</div>
      ) : proposals.length === 0 ? (
        <div className="text-center text-gray-400 py-8">No proposals found</div>
      ) : (
        <div className="space-y-4">
          {proposals.map((proposal) => (
            <div key={proposal.id} className="bg-gray-900 rounded-lg p-5 border border-gray-700">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">{proposal.title}</h3>
                  <p className="text-sm text-gray-400">Proposed by {proposal.proposer}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(proposal.status)}`}>
                  {proposal.status.toUpperCase()}
                </span>
              </div>

              <p className="text-gray-300 text-sm mb-4">{proposal.description}</p>

              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                  <span>{proposal.totalVotes} total votes</span>
                  <span>{getTimeRemaining(proposal.endTime)}</span>
                </div>
                
                <div className="space-y-2">
                  {proposal.options.map((option, index) => {
                    const percentage = proposal.totalVotes > 0 
                      ? Math.round((proposal.votes[index] / proposal.totalVotes) * 100)
                      : 0;
                    
                    return (
                      <div key={index} className="relative">
                        <div className="flex justify-between text-sm text-gray-300 mb-1">
                          <span>{option}</span>
                          <span>{proposal.votes[index]} votes ({percentage}%)</span>
                        </div>
                        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-purple-600 transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {proposal.status === 'active' && (
                <div className="flex gap-2">
                  {proposal.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleVote(proposal.id, index)}
                      disabled={!walletAddress}
                      className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      Vote {option}
                    </button>
                  ))}
                </div>
              )}

              {!walletAddress && proposal.status === 'active' && (
                <p className="text-yellow-400 text-xs text-center mt-2">
                  Connect your wallet to vote
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
