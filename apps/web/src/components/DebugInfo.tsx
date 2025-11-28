'use client';

import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useProgram } from '@/hooks/useProgram';

export function DebugInfo() {
  const wallet = useWallet();
  const { connection } = useConnection();
  const program = useProgram();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 border border-gray-700 rounded-lg p-4 text-xs text-gray-300 max-w-sm z-50">
      <div className="font-bold text-white mb-2">Debug Info</div>
      <div className="space-y-1">
        <div>Connected: {wallet.connected ? '✅' : '❌'}</div>
        <div>PublicKey: {wallet.publicKey ? '✅' : '❌'}</div>
        <div>SignTransaction: {wallet.signTransaction ? '✅' : '❌'}</div>
        <div>SignAllTransactions: {wallet.signAllTransactions ? '✅' : '❌'}</div>
        <div>RPC: {connection.rpcEndpoint}</div>
        <div>Program: {program ? '✅' : '❌'}</div>
        {program && <div>Program ID: {program.programId.toString().slice(0, 8)}...</div>}
      </div>
    </div>
  );
}
