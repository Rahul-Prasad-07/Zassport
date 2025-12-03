#!/bin/bash

# Zassport TIER 1-3 Features Installation Script
# This script installs all dependencies and sets up the advanced features

set -e

echo "🚀 Installing Zassport Advanced Features..."
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running from project root
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: Must run from project root${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} Running from project root"
echo ""

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install
echo -e "${GREEN}✓${NC} Root dependencies installed"
echo ""

# Install mobile app dependencies
echo "📱 Installing mobile app dependencies..."
cd apps/mobile
npm install
npx expo install react-native-nfc-manager expo-local-authentication
cd ../..
echo -e "${GREEN}✓${NC} Mobile dependencies installed"
echo ""

# Install sanctions oracle dependencies
echo "🌐 Installing sanctions oracle dependencies..."
if [ ! -d "services/sanctions-oracle/node_modules" ]; then
    cd services/sanctions-oracle
    npm install
    cd ../..
fi
echo -e "${GREEN}✓${NC} Oracle dependencies installed"
echo ""

# Install SDK dependencies
echo "🛠️  Installing SDK dependencies..."
if [ ! -d "sdk/typescript/node_modules" ]; then
    cd sdk/typescript
    npm install
    cd ../..
fi
echo -e "${GREEN}✓${NC} SDK dependencies installed"
echo ""

# Check for circom installation
echo "🔧 Checking circom installation..."
if ! command -v circom &> /dev/null; then
    echo -e "${YELLOW}⚠${NC}  circom not found. Installing..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install circom
    else
        echo -e "${RED}Please install circom manually: https://docs.circom.io/getting-started/installation/${NC}"
        exit 1
    fi
fi
echo -e "${GREEN}✓${NC} circom installed"
echo ""

# Check for snarkjs installation
echo "🔧 Checking snarkjs installation..."
if ! command -v snarkjs &> /dev/null; then
    echo -e "${YELLOW}Installing snarkjs globally...${NC}"
    npm install -g snarkjs
fi
echo -e "${GREEN}✓${NC} snarkjs installed"
echo ""

# Compile circuits
echo "⚡ Compiling ZK circuits..."

# Age Range Circuit
if [ ! -f "circuits/age_range/age_range.wasm" ]; then
    echo "  Compiling age_range circuit..."
    cd circuits/age_range
    circom age_range.circom --r1cs --wasm --sym --O1 -l ../../node_modules
    cd ../..
    echo -e "${GREEN}✓${NC} age_range compiled"
fi

# Sanctions Circuit
if [ ! -f "circuits/sanctions/sanctions_negative.wasm" ]; then
    echo "  Compiling sanctions_negative circuit..."
    cd circuits/sanctions
    circom sanctions_negative.circom --r1cs --wasm --sym --O1 -l ../../node_modules
    cd ../..
    echo -e "${GREEN}✓${NC} sanctions_negative compiled"
fi

# Expiry Circuit
if [ ! -f "circuits/expiry/expiry_proof.wasm" ]; then
    echo "  Compiling expiry_proof circuit..."
    cd circuits/expiry
    circom expiry_proof.circom --r1cs --wasm --sym --O1 -l ../../node_modules
    cd ../..
    echo -e "${GREEN}✓${NC} expiry_proof compiled"
fi

echo ""
echo -e "${GREEN}✓${NC} All circuits compiled"
echo ""

# Generate trusted setup (development only - use ceremony for production)
echo "🔐 Generating trusted setup (development only)..."
if [ ! -f "circuits/pot12_final.ptau" ]; then
    echo "  Downloading powers of tau..."
    cd circuits
    curl -L https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_12.ptau -o pot12_final.ptau
    cd ..
fi
echo -e "${GREEN}✓${NC} Trusted setup ready"
echo ""

# Generate proving and verification keys
echo "🔑 Generating circuit keys..."

cd circuits/age_range
if [ ! -f "age_range_final.zkey" ]; then
    snarkjs groth16 setup age_range.r1cs ../pot12_final.ptau age_range_final.zkey
    snarkjs zkey export verificationkey age_range_final.zkey verification_key.json
fi
cd ../..

cd circuits/sanctions
if [ ! -f "sanctions_final.zkey" ]; then
    snarkjs groth16 setup sanctions_negative.r1cs ../pot12_final.ptau sanctions_final.zkey
    snarkjs zkey export verificationkey sanctions_final.zkey verification_key.json
fi
cd ../..

cd circuits/expiry
if [ ! -f "expiry_final.zkey" ]; then
    snarkjs groth16 setup expiry_proof.r1cs ../pot12_final.ptau expiry_final.zkey
    snarkjs zkey export verificationkey expiry_final.zkey verification_key.json
fi
cd ../..

echo -e "${GREEN}✓${NC} Circuit keys generated"
echo ""

# Build Anchor program
echo "🏗️  Building Anchor program..."
if command -v anchor &> /dev/null; then
    anchor build
    echo -e "${GREEN}✓${NC} Anchor program built"
else
    echo -e "${YELLOW}⚠${NC}  Anchor CLI not found. Skipping program build."
    echo "   Install Anchor: https://www.anchor-lang.com/docs/installation"
fi
echo ""

# Create .env files if they don't exist
echo "📝 Setting up environment files..."

if [ ! -f "services/sanctions-oracle/.env" ]; then
    cat > services/sanctions-oracle/.env << EOF
PORT=3002
SOLANA_RPC_URL=https://api.devnet.solana.com
ORACLE_PRIVATE_KEY=[]
ADMIN_KEY=your-admin-key-here
EOF
    echo -e "${GREEN}✓${NC} Created sanctions-oracle/.env"
fi

if [ ! -f "verifier-service/.env" ]; then
    cat > verifier-service/.env << EOF
PORT=3000
VERIFIER_PRIVATE_KEY=your-verifier-key-here
SOLANA_RPC_URL=https://api.devnet.solana.com
PROGRAM_ID=FR6XtcALdJfPRTLzSyhjt5fJ1eoYsEn8kq4vcGAkd8WQ
EOF
    echo -e "${GREEN}✓${NC} Created verifier-service/.env"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   Installation Complete! 🎉${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Next steps:"
echo ""
echo "1. Deploy Anchor program (if not already deployed):"
echo "   ${YELLOW}anchor deploy --provider.cluster devnet${NC}"
echo ""
echo "2. Start the sanctions oracle:"
echo "   ${YELLOW}cd services/sanctions-oracle && npm start${NC}"
echo ""
echo "3. Start the verifier service:"
echo "   ${YELLOW}cd verifier-service && npm start${NC}"
echo ""
echo "4. Start the web app:"
echo "   ${YELLOW}cd apps/web && npm run dev${NC}"
echo ""
echo "5. Start the mobile app:"
echo "   ${YELLOW}cd apps/mobile && expo start${NC}"
echo ""
echo "📚 Documentation: See ADVANCED_FEATURES.md"
echo "🎯 Test with real NFC passport in mobile app"
echo ""
