pragma circom 2.1.0;

include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/comparators.circom";
include "../node_modules/circomlib/circuits/mux1.circom";

/**
 * Merkle Negative Membership Proof
 * Proves an element is NOT in a Merkle tree (sanctions list)
 */
template MerkleNegativeProof(levels) {
    signal input leaf;                    // Hash of passport data
    signal input root;                    // Merkle root of sanctions list
    signal input pathElements[levels];    // Merkle proof elements
    signal input pathIndices[levels];     // 0 = left, 1 = right
    
    signal output isNotSanctioned;        // 1 if NOT in list, 0 if in list
    
    // Compute Merkle root from leaf and path
    component hashers[levels];
    component leftHashers[levels];
    component rightHashers[levels];
    component muxes[levels];
    signal computedPath[levels + 1];
    computedPath[0] <== leaf;
    
    for (var i = 0; i < levels; i++) {
        leftHashers[i] = Poseidon(2);
        rightHashers[i] = Poseidon(2);
        muxes[i] = Mux1();

        // Hash with computedPath on left, pathElements on right
        leftHashers[i].inputs[0] <== computedPath[i];
        leftHashers[i].inputs[1] <== pathElements[i];

        // Hash with pathElements on left, computedPath on right
        rightHashers[i].inputs[0] <== pathElements[i];
        rightHashers[i].inputs[1] <== computedPath[i];

        // Select which hash to use based on pathIndices[i]
        muxes[i].c[0] <== leftHashers[i].out;
        muxes[i].c[1] <== rightHashers[i].out;
        muxes[i].s <== pathIndices[i];

        computedPath[i + 1] <== muxes[i].out;
    }    // Check if computed root matches provided root
    component rootCheck = IsEqual();
    rootCheck.in[0] <== computedPath[levels];
    rootCheck.in[1] <== root;
    
    // Output 1 if roots DON'T match (not in list)
    // Output 0 if roots match (in list)
    isNotSanctioned <== 1 - rootCheck.out;
}

/**
 * Sanctions Negative Proof Circuit
 * Proves passport holder is NOT on sanctions lists
 */
template SanctionsNegativeProof(merkleDepth) {
    // Private inputs
    signal input passportNumber;
    signal input dateOfBirth;
    signal input nationality;
    signal input randomness;
    
    // Public inputs
    signal input sanctionsRoot;           // Merkle root of sanctions list
    signal input merkleProof[merkleDepth];
    signal input merkleIndices[merkleDepth];
    signal input commitment;              // Public commitment
    
    // Public outputs
    signal output isClean;                // 1 if not sanctioned
    signal output nullifier;
    
    // Compute passport hash
    component passportHash = Poseidon(3);
    passportHash.inputs[0] <== passportNumber;
    passportHash.inputs[1] <== dateOfBirth;
    passportHash.inputs[2] <== nationality;
    
    // Verify negative membership
    component negativeProof = MerkleNegativeProof(merkleDepth);
    negativeProof.leaf <== passportHash.out;
    negativeProof.root <== sanctionsRoot;
    
    for (var i = 0; i < merkleDepth; i++) {
        negativeProof.pathElements[i] <== merkleProof[i];
        negativeProof.pathIndices[i] <== merkleIndices[i];
    }
    
    isClean <== negativeProof.isNotSanctioned;
    
    // Generate nullifier
    component nullifierHash = Poseidon(2);
    nullifierHash.inputs[0] <== passportHash.out;
    nullifierHash.inputs[1] <== randomness;
    nullifier <== nullifierHash.out;
    
    // Verify commitment
    component commitmentCheck = Poseidon(4);
    commitmentCheck.inputs[0] <== passportNumber;
    commitmentCheck.inputs[1] <== dateOfBirth;
    commitmentCheck.inputs[2] <== nationality;
    commitmentCheck.inputs[3] <== randomness;
    commitment === commitmentCheck.out;
}

component main {public [sanctionsRoot, commitment]} = SanctionsNegativeProof(20);
