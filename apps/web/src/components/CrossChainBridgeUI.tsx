'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import {
  CHAIN_CONFIGS,
  CHAIN_IDS,
  ChainId,
  CrossChainAttestation,
  bridgeAttestation,
  crossChainBridge,
} from '@/lib/cross-chain';

interface ClaimInfo {
  id: string;
  type: 'age' | 'nationality' | 'validity' | 'sanctions';
  commitment: string;
  verified: boolean;
}

interface CrossChainBridgeUIProps {
  claims?: ClaimInfo[];
  onBridgeComplete?: (claimId: string, targetChain: string, txId: string) => void;
}

export function CrossChainBridgeUI({ claims = [], onBridgeComplete }: CrossChainBridgeUIProps) {
  const { publicKey } = useWallet();
  const [selectedChain, setSelectedChain] = useState<ChainId>(CHAIN_IDS.ETHEREUM);
  const [selectedAttestation, setSelectedAttestation] = useState<'age' | 'nationality' | 'validity' | 'sanctions'>('age');
  const [isBridging, setIsBridging] = useState(false);
  const [bridgeStatus, setBridgeStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [txId, setTxId] = useState<string | null>(null);
  const [estimatedTime, setEstimatedTime] = useState<string | null>(null);
  const [fee, setFee] = useState<{ totalUsd: number } | null>(null);
  const [bridgedAttestations, setBridgedAttestations] = useState<CrossChainAttestation[]>([]);

  const supportedChains = crossChainBridge.getSupportedChains().filter(c => c.id !== CHAIN_IDS.SOLANA);

  useEffect(() => {
    loadFee();
    loadBridgedAttestations();
  }, [selectedChain, publicKey]);

  async function loadFee() {
    const feeEstimate = await crossChainBridge.estimateBridgeFee(selectedChain);
    setFee(feeEstimate);
  }

  async function loadBridgedAttestations() {
    if (publicKey) {
      const attestations = await crossChainBridge.getBridgedAttestations(publicKey.toString());
      setBridgedAttestations(attestations);
    }
  }

  async function handleBridge() {
    if (!publicKey) {
      setError('Please connect your wallet');
      return;
    }

    setIsBridging(true);
    setBridgeStatus('pending');
    setError(null);

    try {
      // In production, you would get the actual attestation proof from the user's claims
      const mockProof = `proof-${Date.now()}`;
      const mockValue = selectedAttestation === 'age' ? '18' : 
                        selectedAttestation === 'nationality' ? 'USA' :
                        selectedAttestation === 'validity' ? 'valid' : 'clear';

      const result = await bridgeAttestation(
        selectedAttestation,
        mockValue,
        selectedChain,
        publicKey.toString(),
        mockProof
      );

      setTxId(result.txId);
      setEstimatedTime(result.estimatedTime);
      setBridgeStatus('success');
      
      // Store the bridged attestation
      const attestation: CrossChainAttestation = {
        sourceChain: CHAIN_IDS.SOLANA,
        targetChain: selectedChain,
        attestationType: selectedAttestation,
        attestedValue: mockValue,
        sourceAddress: publicKey.toString(),
        timestamp: Math.floor(Date.now() / 1000),
        expiry: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60),
        proof: mockProof,
      };
      
      crossChainBridge.storeBridgedAttestation(publicKey.toString(), attestation);
      loadBridgedAttestations();
      
      // Support both callback signatures
      const chainName = CHAIN_CONFIGS[selectedChain]?.name || String(selectedChain);
      onBridgeComplete?.(selectedAttestation, chainName, result.txId);
    } catch (e: any) {
      setError(e.message || 'Bridge failed');
      setBridgeStatus('error');
    } finally {
      setIsBridging(false);
    }
  }

  const attestationTypes = [
    { id: 'age', label: 'Age Verification', icon: '🎂', color: 'from-pink-500 to-rose-600' },
    { id: 'nationality', label: 'Nationality', icon: '🌍', color: 'from-blue-500 to-cyan-600' },
    { id: 'validity', label: 'Document Validity', icon: '✓', color: 'from-green-500 to-emerald-600' },
    { id: 'sanctions', label: 'Sanctions Clear', icon: '🛡️', color: 'from-purple-500 to-violet-600' },
  ];

  return (
    <div className="bg-gradient-to-br from-slate-900 via-purple-900/50 to-slate-900 rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-pink-600 rounded-xl flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Cross-Chain Bridge</h2>
          <p className="text-sm text-gray-400">Bridge your attestations to other blockchains</p>
        </div>
      </div>

      {bridgeStatus === 'idle' && (
        <>
          {/* Source Chain */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">From</label>
            <div className="bg-slate-800/50 rounded-xl p-4 flex items-center gap-3">
              <span className="text-2xl">{CHAIN_CONFIGS[CHAIN_IDS.SOLANA].icon}</span>
              <div>
                <p className="text-white font-medium">{CHAIN_CONFIGS[CHAIN_IDS.SOLANA].name}</p>
                <p className="text-xs text-gray-500">Source Chain</p>
              </div>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center my-4">
            <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          </div>

          {/* Target Chain Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">To</label>
            <div className="grid grid-cols-3 gap-2">
              {supportedChains.map((chain) => (
                <button
                  key={chain.id}
                  onClick={() => setSelectedChain(chain.id)}
                  className={`p-3 rounded-xl text-center transition-all ${
                    selectedChain === chain.id
                      ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white ring-2 ring-purple-400/50'
                      : 'bg-slate-800/50 text-gray-400 hover:bg-slate-800'
                  }`}
                >
                  <span className="text-xl block mb-1">{chain.icon}</span>
                  <span className="text-xs font-medium">{chain.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Attestation Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">Attestation to Bridge</label>
            <div className="grid grid-cols-2 gap-2">
              {attestationTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelectedAttestation(type.id as any)}
                  className={`p-3 rounded-xl text-left transition-all ${
                    selectedAttestation === type.id
                      ? `bg-gradient-to-br ${type.color} text-white`
                      : 'bg-slate-800/50 text-gray-400 hover:bg-slate-800'
                  }`}
                >
                  <span className="text-lg">{type.icon}</span>
                  <span className="block text-xs font-medium mt-1">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Fee Estimate */}
          {fee && (
            <div className="mb-6 p-4 bg-slate-800/30 rounded-xl">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Estimated Fee</span>
                <span className="text-white font-medium">~${fee.totalUsd.toFixed(2)} USD</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Includes Solana tx + Wormhole relay + {CHAIN_CONFIGS[selectedChain].name} gas
              </p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Bridge Button */}
          <button
            onClick={handleBridge}
            disabled={isBridging || !publicKey}
            className="w-full py-4 bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-500 hover:to-pink-500 text-white font-semibold rounded-xl transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:transform-none flex items-center justify-center gap-2"
          >
            {isBridging ? (
              <>
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Bridging...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                Bridge to {CHAIN_CONFIGS[selectedChain].name}
              </>
            )}
          </button>
        </>
      )}

      {/* Success State */}
      {bridgeStatus === 'success' && (
        <div className="text-center py-8">
          <div className="w-20 h-20 mx-auto mb-6 relative">
            <div className="absolute inset-0 bg-green-500/30 rounded-full animate-pulse"></div>
            <div className="absolute inset-3 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          
          <h3 className="text-xl font-bold text-white mb-2">Bridge Initiated!</h3>
          <p className="text-gray-400 mb-4">
            Your attestation is being bridged to {CHAIN_CONFIGS[selectedChain].name}
          </p>
          
          <div className="bg-slate-800/50 rounded-xl p-4 mb-6 text-left space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Transaction ID</span>
              <span className="text-blue-400 font-mono text-xs">{txId?.slice(0, 16)}...</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Estimated Time</span>
              <span className="text-white">{estimatedTime}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Status</span>
              <span className="text-amber-400 flex items-center gap-1">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing
              </span>
            </div>
          </div>
          
          <button
            onClick={() => setBridgeStatus('idle')}
            className="w-full py-3 bg-slate-700/50 text-gray-300 rounded-xl hover:bg-slate-700 transition-colors"
          >
            Bridge Another Attestation
          </button>
        </div>
      )}

      {/* Bridged Attestations History */}
      {bridgedAttestations.length > 0 && bridgeStatus === 'idle' && (
        <div className="mt-6 pt-6 border-t border-slate-700/50">
          <h3 className="text-sm font-medium text-gray-300 mb-3">Bridged Attestations</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {bridgedAttestations.map((att, idx) => (
              <div key={idx} className="flex items-center justify-between bg-slate-800/30 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{CHAIN_CONFIGS[att.targetChain]?.icon || '?'}</span>
                  <div>
                    <p className="text-sm text-white capitalize">{att.attestationType}</p>
                    <p className="text-xs text-gray-500">
                      to {CHAIN_CONFIGS[att.targetChain]?.name || 'Unknown'}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-green-400 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 8 8">
                    <circle cx="4" cy="4" r="3" />
                  </svg>
                  Active
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="mt-6 pt-4 border-t border-slate-700/50">
        <div className="flex items-start gap-2 text-xs text-gray-500">
          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            Attestations are bridged via Wormhole protocol. Once bridged, they can be verified on the target chain.
          </span>
        </div>
      </div>
    </div>
  );
}

export default CrossChainBridgeUI;
