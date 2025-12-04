'use client';

import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { useState, useEffect } from 'react';

function WalletButtonContent() {
  const { publicKey, connected } = useWallet();

  // When connected, show a cleaner button
  if (connected && publicKey) {
    return (
      <WalletMultiButton 
        className="!bg-slate-800 hover:!bg-slate-700 !text-white !rounded-xl !px-4 !py-2.5 !font-medium !text-sm !transition-all !duration-200 !border !border-slate-700 hover:!border-slate-600 !h-auto !leading-normal"
        style={{ 
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      />
    );
  }

  // When not connected, show prominent connect button
  return (
    <WalletMultiButton 
      className="!bg-gradient-to-r !from-emerald-600 !to-teal-600 hover:!from-emerald-500 hover:!to-teal-500 !text-white !rounded-xl !px-6 !py-2.5 !font-semibold !text-sm !transition-all !duration-200 !shadow-lg !shadow-emerald-500/20 hover:!shadow-emerald-500/30 !h-auto !leading-normal" 
    />
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
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl px-6 py-2.5 font-semibold text-sm opacity-70 cursor-pointer">
        Select Wallet
      </div>
    );
  }

  return <WalletButtonContent />;
}

// Alternative compact version for headers
export function WalletConnectButtonCompact() {
  const [mounted, setMounted] = useState(false);
  const { publicKey, connected } = useWallet();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="bg-slate-800 text-white rounded-lg px-4 py-2 text-sm opacity-70">
        Connect
      </div>
    );
  }

  return (
    <WalletMultiButton 
      className={`!rounded-xl !px-4 !py-2 !font-medium !text-sm !transition-all !duration-200 !h-auto !leading-normal ${
        connected 
          ? '!bg-slate-800 hover:!bg-slate-700 !border !border-slate-700 hover:!border-slate-600' 
          : '!bg-emerald-600 hover:!bg-emerald-500'
      } !text-white`}
    />
  );
}