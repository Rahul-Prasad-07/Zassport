'use client';

import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { useState, useEffect } from 'react';

function WalletButtonContent() {
  const { publicKey } = useWallet();

  return (
    <div className="flex items-center gap-4">
      <WalletMultiButton className="!bg-emerald-600 hover:!bg-emerald-700 !text-white !rounded-lg !px-6 !py-2 !font-medium" />
      {publicKey && (
        <div className="text-sm text-slate-400">
          Connected: {publicKey.toBase58().slice(0, 8)}...
        </div>
      )}
    </div>
  );
}

export function WalletConnectButton() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch by showing placeholder on server
  if (!mounted) {
    return (
      <div className="flex items-center gap-4">
        <div className="bg-emerald-600 text-white rounded-lg px-6 py-2 font-medium opacity-70 cursor-pointer">
          Select Wallet
        </div>
      </div>
    );
  }

  return <WalletButtonContent />;
}