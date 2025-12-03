pragma circom 2.1.0;

include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/comparators.circom";

/**
 * Document Expiry Proof Circuit
 * Proves passport is not expired without revealing expiry date
 */
template DocumentExpiryProof() {
    // Private inputs
    signal input expiryDate;        // Unix timestamp of expiry
    signal input randomness;
    
    // Public inputs
    signal input currentTime;       // Current Unix timestamp
    signal input commitment;        // Public commitment
    
    // Public outputs
    signal output isValid;          // 1 if not expired, 0 if expired
    signal output nullifier;
    
    // Check if document is still valid
    // expiryDate > currentTime means valid
    component expiryCheck = GreaterThan(64);
    expiryCheck.in[0] <== expiryDate;
    expiryCheck.in[1] <== currentTime;
    isValid <== expiryCheck.out;
    
    // Generate nullifier
    component nullifierHash = Poseidon(2);
    nullifierHash.inputs[0] <== expiryDate;
    nullifierHash.inputs[1] <== randomness;
    nullifier <== nullifierHash.out;
    
    // Verify commitment
    component commitmentCheck = Poseidon(2);
    commitmentCheck.inputs[0] <== expiryDate;
    commitmentCheck.inputs[1] <== randomness;
    commitment === commitmentCheck.out;
}

component main {public [currentTime, commitment]} = DocumentExpiryProof();
