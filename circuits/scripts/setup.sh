#!/bin/bash

# Install Circom
echo "Installing Circom..."
if ! command -v circom &> /dev/null; then
    # Install Rust if not present
    if ! command -v cargo &> /dev/null; then
        echo "Installing Rust..."
        curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
        source $HOME/.cargo/env
    fi

    # Install Circom
    cargo install --git https://github.com/iden3/circom.git --tag v2.1.6
else
    echo "Circom already installed"
fi

# Install snarkjs
echo "Installing snarkjs..."
if ! command -v snarkjs &> /dev/null; then
    npm install -g snarkjs
else
    echo "snarkjs already installed"
fi

# Install circomlib
echo "Setting up circomlib..."
if [ ! -d "node_modules/circomlib" ]; then
    npm install circomlib
fi

echo "Setup complete! You can now compile circuits with: ./circuits/scripts/compile.sh"