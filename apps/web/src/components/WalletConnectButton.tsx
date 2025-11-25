'use client';

import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';

export function WalletConnectButton() {
  const { publicKey } = useWallet();

  return (
    <div className="flex items-center gap-4">
      <WalletMultiButton className="!bg-blue-600 hover:!bg-blue-700 !text-white !rounded-lg !px-6 !py-2 !font-medium" />
      {publicKey && (
        <div className="text-sm text-gray-600">
          Connected: {publicKey.toBase58().slice(0, 8)}...
        </div>
      )}
    </div>
  );
}