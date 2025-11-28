#!/bin/bash

# Zassport Deployment Script
# Usage: ./scripts/deploy.sh [devnet|mainnet]

set -e

CLUSTER=${1:-devnet}

echo "🚀 Deploying Zassport to $CLUSTER..."
echo ""

# 1. Build program
echo "📦 Building program..."
anchor build

# 2. Deploy
echo "🌐 Deploying to $CLUSTER..."
anchor deploy --provider.cluster $CLUSTER

# 3. Get deployed program ID
PROGRAM_ID=$(solana address -k target/deploy/zassport-keypair.json)
echo ""
echo "✅ Program deployed!"
echo "   Program ID: $PROGRAM_ID"
echo ""

# 4. Update Anchor.toml
echo "📝 Updating Anchor.toml..."
if [[ "$CLUSTER" == "mainnet" ]]; then
  sed -i.bak "s/^zassport = .*/zassport = \"$PROGRAM_ID\"/" Anchor.toml
  echo "   Updated [programs.mainnet]"
else
  sed -i.bak "s/^zassport = .*/zassport = \"$PROGRAM_ID\"/" Anchor.toml
  echo "   Updated [programs.devnet]"
fi

# 5. Rebuild with new ID
echo "🔄 Rebuilding with new program ID..."
anchor build

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "  1. Generate verifier keypair:"
echo "     cd verifier-service && node scripts/generate-keypair.js"
echo ""
echo "  2. Initialize verifier config on-chain:"
echo "     anchor run init-verifier --provider.cluster $CLUSTER"
echo ""
echo "  3. Start verifier service:"
echo "     cd verifier-service && npm start"
echo ""
