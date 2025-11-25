#!/bin/bash

# Generate trusted setups and test proofs for all circuits

echo "Setting up trusted setup ceremony..."

# Generate powers of tau for each circuit
echo "Generating powers of tau for passport verifier..."
snarkjs powersoftau new bn128 14 circuits/passport_verifier/build/pot14_0000.ptau -v

echo "Generating powers of tau for age proof..."
snarkjs powersoftau new bn128 12 circuits/age_proof/build/pot12_0000.ptau -v

echo "Generating powers of tau for nationality proof..."
snarkjs powersoftau new bn128 12 circuits/nationality_proof/build/pot12_0000.ptau -v

# Contribute randomness (simplified for testing)
echo "Contributing randomness to ceremonies..."
snarkjs powersoftau contribute circuits/passport_verifier/build/pot14_0000.ptau circuits/passport_verifier/build/pot14_0001.ptau --name="First contribution" -v
snarkjs powersoftau contribute circuits/age_proof/build/pot12_0000.ptau circuits/age_proof/build/pot12_0001.ptau --name="First contribution" -v
snarkjs powersoftau contribute circuits/nationality_proof/build/pot12_0000.ptau circuits/nationality_proof/build/pot12_0001.ptau --name="First contribution" -v

# Prepare phase 2
echo "Preparing phase 2..."
snarkjs powersoftau prepare phase2 circuits/passport_verifier/build/pot14_0001.ptau circuits/passport_verifier/build/pot14_final.ptau -v
snarkjs powersoftau prepare phase2 circuits/age_proof/build/pot12_0001.ptau circuits/age_proof/build/pot12_final.ptau -v
snarkjs powersoftau prepare phase2 circuits/nationality_proof/build/pot12_0001.ptau circuits/nationality_proof/build/pot12_final.ptau -v

# Generate verification keys
echo "Generating verification keys..."
snarkjs groth16 setup circuits/passport_verifier/build/circuit.r1cs circuits/passport_verifier/build/pot14_final.ptau circuits/passport_verifier/build/circuit_0000.zkey
snarkjs groth16 setup circuits/age_proof/build/circuit.r1cs circuits/age_proof/build/pot12_final.ptau circuits/age_proof/build/circuit_0000.zkey
snarkjs groth16 setup circuits/nationality_proof/build/circuit.r1cs circuits/nationality_proof/build/pot12_final.ptau circuits/nationality_proof/build/circuit_0000.zkey

# Contribute to verification keys
echo "Contributing to verification keys..."
snarkjs zkey contribute circuits/passport_verifier/build/circuit_0000.zkey circuits/passport_verifier/build/circuit_0001.zkey --name="1st Contributor" -v
snarkjs zkey contribute circuits/age_proof/build/circuit_0000.zkey circuits/age_proof/build/circuit_0001.zkey --name="1st Contributor" -v
snarkjs zkey contribute circuits/nationality_proof/build/circuit_0000.zkey circuits/nationality_proof/build/circuit_0001.zkey --name="1st Contributor" -v

# Export verification keys
echo "Exporting verification keys..."
snarkjs zkey export verificationkey circuits/passport_verifier/build/circuit_0001.zkey circuits/passport_verifier/build/verification_key.json
snarkjs zkey export verificationkey circuits/age_proof/build/circuit_0001.zkey circuits/age_proof/build/verification_key.json
snarkjs zkey export verificationkey circuits/nationality_proof/build/circuit_0001.zkey circuits/nationality_proof/build/verification_key.json

echo "Trusted setup complete!"
echo "Generating test proofs..."

# Create test input files
echo "Creating test inputs..."

# Passport verifier test inputs
cat > circuits/passport_verifier/build/input.json << EOF
{
    "commitment": "14841545394543506365868236097126860800961652566175094045953188104812257184857",
    "nullifier": "7110303097080024260800444665787206606103183587082596139871399733998958991511",
    "currentTimestamp": "1704067200",
    "minAge": "18",
    "maxAge": "65",
    "passportNumber": "123456789",
    "dateOfBirth": "1041379200",
    "expirationDate": "1735689600",
    "signature": "1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890",
    "modulus": "9876543210987654321098765432109876543210987654321098765432109876543210987654321098765432109876543210",
    "salt": "1111111111111111111111111111111111111111"
}
EOF

# Age proof test inputs
cat > circuits/age_proof/build/input.json << EOF
{
    "commitment": "20871624214215675622479845848920834446738023415021754645722415056779211807972",
    "nullifier": "7081447569075060275571034042383455590356981525130236913069464874260773703160",
    "currentTimestamp": "1704067200",
    "minAge": "21",
    "maxAge": "65",
    "dateOfBirth": "1041379200",
    "salt": "1111111111111111111111111111111111111111"
}
EOF

# Nationality proof test inputs
cat > circuits/nationality_proof/build/input.json << EOF
{
    "commitment": "21335626596128816980693514499037509348987756030553033542848656882874534921320",
    "nullifier": "7110303097080024260800444665787206606103183587082596139871399733998958991511",
    "allowedNationality": "840",
    "passportNumber": "123456789",
    "nationality": "840",
    "salt": "1111111111111111111111111111111111111111"
}
EOF

# Generate proofs
echo "Generating witnesses..."
snarkjs wtns calculate circuits/passport_verifier/build/circuit_js/circuit.wasm circuits/passport_verifier/build/input.json circuits/passport_verifier/build/witness.wtns
snarkjs wtns calculate circuits/age_proof/build/circuit_js/circuit.wasm circuits/age_proof/build/input.json circuits/age_proof/build/witness.wtns
snarkjs wtns calculate circuits/nationality_proof/build/circuit_js/circuit.wasm circuits/nationality_proof/build/input.json circuits/nationality_proof/build/witness.wtns

echo "Generating proofs..."
snarkjs groth16 prove circuits/passport_verifier/build/circuit_0001.zkey circuits/passport_verifier/build/witness.wtns circuits/passport_verifier/build/proof.json circuits/passport_verifier/build/public.json
snarkjs groth16 prove circuits/age_proof/build/circuit_0001.zkey circuits/age_proof/build/witness.wtns circuits/age_proof/build/proof.json circuits/age_proof/build/public.json
snarkjs groth16 prove circuits/nationality_proof/build/circuit_0001.zkey circuits/nationality_proof/build/witness.wtns circuits/nationality_proof/build/proof.json circuits/nationality_proof/build/public.json

# Verify proofs
echo "Verifying proofs..."
snarkjs groth16 verify circuits/passport_verifier/build/verification_key.json circuits/passport_verifier/build/public.json circuits/passport_verifier/build/proof.json
snarkjs groth16 verify circuits/age_proof/build/verification_key.json circuits/age_proof/build/public.json circuits/age_proof/build/proof.json
snarkjs groth16 verify circuits/nationality_proof/build/verification_key.json circuits/nationality_proof/build/public.json circuits/nationality_proof/build/proof.json

echo "Test proof generation complete!"</content>
<parameter name="filePath">/Users/kyto/zk/Zassport/circuits/scripts/test_proofs.sh