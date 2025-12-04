export const config = {
  verifierUrl:
    process.env.NEXT_PUBLIC_VERIFIER_URL?.replace(/\/$/, '') || 'https://zassport-verifier.onrender.com',
  sanctionsUrl:
    process.env.NEXT_PUBLIC_SANCTIONS_URL?.replace(/\/$/, '') || 'http://localhost:3002',
  rpcUrl:
    process.env.NEXT_PUBLIC_RPC_URL || 'https://api.devnet.solana.com',
};
