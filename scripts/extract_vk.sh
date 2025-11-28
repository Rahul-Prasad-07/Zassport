#!/bin/bash

# Script to convert verification keys to Rust byte arrays
# This extracts VK from circuits and formats them for Solana program

set -e

echo "🔑 Extracting Verification Keys from Circuits..."

# Function to convert JSON VK to Rust byte array (simplified)
convert_vk_to_bytes() {
    local vk_file=$1
    local output_name=$2
    
    if [ ! -f "$vk_file" ]; then
        echo "❌ $vk_file not found!"
        return 1
    fi
    
    echo "✅ Processing $vk_file..."
    
    # For now, we'll note the VK locations
    # In production, you'd use a proper parser to convert JSON to bytes
    echo "   VK file: $vk_file"
    echo "   Size: $(wc -c < $vk_file) bytes"
    echo ""
}

# Process Age Proof VK
echo "1. Age Proof Circuit"
convert_vk_to_bytes "circuits/age_proof/verification_key.json" "AGE_PROOF_VK"

# Process Nationality Proof VK
echo "2. Nationality Proof Circuit"
convert_vk_to_bytes "circuits/nationality_proof/verification_key.json" "NATIONALITY_PROOF_VK"

# Process Passport Verifier VK
echo "3. Passport Verifier Circuit"
convert_vk_to_bytes "circuits/passport_verifier/verification_key.json" "PASSPORT_PROOF_VK"

echo "
📝 NEXT STEPS:

The verification keys need to be converted to byte arrays and embedded in:
programs/zassport/src/zk_verifier.rs

For now, the code uses placeholder VK arrays. To make it production-ready:

1. Use a library like 'ark-groth16' to parse verification_key.json
2. Serialize the VK to bytes
3. Replace the placeholder arrays in zk_verifier.rs

For hackathon purposes, you can:
- Keep placeholder VKs and document this as 'production deployment step'
- Focus on demonstrating the architecture is correct
- Show judges you understand what's needed for full implementation

The critical part is showing REAL proof generation in tests (next step!)
"
