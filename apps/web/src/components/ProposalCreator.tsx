'use client';

import { useState } from 'react';
import * as anchor from '@coral-xyz/anchor';
import { useProgram } from '@/hooks/useProgram';

interface ProposalCreatorProps {
  walletAddress?: string;
}

export default function ProposalCreator({ walletAddress }: ProposalCreatorProps) {
  const program = useProgram();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(7);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!program || !walletAddress) {
      alert('Please connect your wallet first');
      return;
    }

    if (!title || !description) {
      alert('Please fill in all fields');
      return;
    }

    setIsCreating(true);
    try {
      // Get next proposal ID
      const proposalAccounts = await (program.account as any).GovernanceProposal.all();
      const maxId = proposalAccounts.length > 0 ? Math.max(...proposalAccounts.map((p: any) => p.account.id.toNumber())) : 0;
      const proposalId = maxId + 1;

      // Call create_proposal instruction
      const tx = await program.methods
        .createProposal(new anchor.BN(proposalId), title, description, new anchor.BN(duration * 24 * 60 * 60))
        .rpc();

      alert('Proposal created successfully! TX: ' + tx);
      
      // Reset form
      setTitle('');
      setDescription('');
      setDuration(7);
    } catch (error) {
      console.error('Error creating proposal:', error);
      alert('Failed to create proposal: ' + (error as Error).message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h2 className="text-2xl font-bold text-white mb-6">Create Governance Proposal</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-gray-300 mb-2 font-medium">Proposal Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Add new nationality to whitelist"
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            maxLength={100}
          />
        </div>

        <div>
          <label className="block text-gray-300 mb-2 font-medium">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detailed description of the proposal..."
            rows={4}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            maxLength={1000}
          />
        </div>

        <div>
          <label className="block text-gray-300 mb-2 font-medium">Voting Duration (days)</label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="1"
              max="30"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value))}
              className="flex-1"
            />
            <span className="text-white font-bold w-20 text-center">
              {duration} {duration === 1 ? 'day' : 'days'}
            </span>
          </div>
        </div>

        <button
          onClick={handleCreate}
          disabled={isCreating || !walletAddress}
          className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
        >
          {isCreating ? 'Creating Proposal...' : 'Create Proposal'}
        </button>

        {!walletAddress && (
          <p className="text-yellow-400 text-sm text-center">
            ⚠️ Connect your wallet to create proposals
          </p>
        )}

        <div className="mt-4 p-4 bg-gray-900 rounded-lg border border-gray-700">
          <p className="text-sm text-gray-400">
            <strong className="text-gray-300">Note:</strong> Proposals are voted Yes/No. Creating a proposal requires an active identity.
            Your vote weight is proportional to your reputation in the system.
          </p>
        </div>
      </div>
    </div>
  );
}
