'use client';

import { useState } from 'react';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { Program, AnchorProvider } from '@coral-xyz/anchor';

interface ProposalCreatorProps {
  program?: Program;
  walletAddress?: string;
}

export default function ProposalCreator({ program, walletAddress }: ProposalCreatorProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [duration, setDuration] = useState(7);
  const [isCreating, setIsCreating] = useState(false);

  const addOption = () => {
    if (options.length < 5) {
      setOptions([...options, '']);
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleCreate = async () => {
    if (!program || !walletAddress) {
      alert('Please connect your wallet first');
      return;
    }

    if (!title || !description || options.some(opt => !opt.trim())) {
      alert('Please fill in all fields');
      return;
    }

    setIsCreating(true);
    try {
      // Call create_proposal instruction
      const tx = await program.methods
        .createProposal(title, description, options, duration * 24 * 60 * 60)
        .accounts({
          proposer: new PublicKey(walletAddress),
          // Add other required accounts
        })
        .rpc();

      alert('Proposal created successfully! TX: ' + tx);
      
      // Reset form
      setTitle('');
      setDescription('');
      setOptions(['', '']);
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
          <label className="block text-gray-300 mb-2 font-medium">Voting Options</label>
          <div className="space-y-2">
            {options.map((option, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                  className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                {options.length > 2 && (
                  <button
                    onClick={() => removeOption(index)}
                    className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            {options.length < 5 && (
              <button
                onClick={addOption}
                className="text-purple-400 hover:text-purple-300 text-sm font-medium"
              >
                + Add Option
              </button>
            )}
          </div>
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
            <strong className="text-gray-300">Note:</strong> Creating a proposal requires a minimum reputation score.
            Your vote weight is proportional to your reputation in the system.
          </p>
        </div>
      </div>
    </div>
  );
}
