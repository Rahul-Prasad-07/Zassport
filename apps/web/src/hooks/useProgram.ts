'use client';

import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useMemo } from 'react';
import { getProgram } from '@/lib/anchor';
import { Program } from '@coral-xyz/anchor';

export function useProgram(): Program | null {
  const { connection } = useConnection();
  const wallet = useWallet();

  return useMemo(() => {
    if (!wallet.publicKey) {
      console.log('Program initialization: Wallet not connected');
      return null;
    }

    try {
      // Create a minimal wallet adapter that Anchor needs
      const anchorWallet = {
        publicKey: wallet.publicKey,
        signTransaction: wallet.signTransaction 
          ? wallet.signTransaction.bind(wallet)
          : async (tx: any) => {
              throw new Error('signTransaction not available');
            },
        signAllTransactions: wallet.signAllTransactions
          ? wallet.signAllTransactions.bind(wallet)
          : async (txs: any[]) => {
              throw new Error('signAllTransactions not available');
            },
      };

      const program = getProgram(connection, anchorWallet as any);
      console.log('Program initialized successfully:', program.programId.toString());
      return program;
    } catch (error) {
      console.error('Error creating program:', error);
      return null;
    }
  }, [connection, wallet.publicKey, wallet.signTransaction, wallet.signAllTransactions]);
}
