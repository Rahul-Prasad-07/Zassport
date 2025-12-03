export const config = {
  verifierUrl:
    process.env.NEXT_PUBLIC_VERIFIER_URL?.replace(/\/$/, '') || 'http://localhost:3000',
  sanctionsUrl:
    process.env.NEXT_PUBLIC_SANCTIONS_URL?.replace(/\/$/, '') || 'http://localhost:3002',
};
