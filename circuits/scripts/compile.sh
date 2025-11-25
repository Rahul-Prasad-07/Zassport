#!/bin/bash

# Compile passport verifier circuit
echo "Compiling passport verifier circuit..."
circom circuits/passport_verifier/circuit.circom --r1cs --wasm --sym --c -o circuits/passport_verifier/build -l ./node_modules

# Compile age proof circuit
echo "Compiling age proof circuit..."
circom circuits/age_proof/circuit.circom --r1cs --wasm --sym --c -o circuits/age_proof/build -l ./node_modules

# Compile nationality proof circuit
echo "Compiling nationality proof circuit..."
circom circuits/nationality_proof/circuit.circom --r1cs --wasm --sym --c -o circuits/nationality_proof/build -l ./node_modules

echo "Circuit compilation complete!"