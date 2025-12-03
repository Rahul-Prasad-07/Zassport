pragma circom 2.1.0;

include "../node_modules/circomlib/circuits/sha256/sha256.circom";
include "../node_modules/circomlib/circuits/comparators.circom";
include "../node_modules/circomlib/circuits/poseidon.circom";

/**
 * Age Range Proof Circuit
 * Proves age falls within specified range without revealing exact birthdate
 * Supports multiple thresholds: 13+, 16+, 18+, 21+, 65+
 */
template AgeRangeProof() {
    // Private inputs
    signal input birthdate;         // Unix timestamp of birth
    signal input randomness;        // Random salt for commitment
    
    // Public inputs
    signal input currentTime;       // Current Unix timestamp
    signal input minAge;            // Minimum age requirement (in years)
    signal input commitment;        // Poseidon hash of passport data
    
    // Public outputs
    signal output ageValid;         // 1 if age >= minAge, 0 otherwise
    signal output nullifier;        // Prevents double-spending
    
    // Constants
    var SECONDS_PER_YEAR = 31536000; // 365 days
    
    // Calculate age in seconds
    signal ageDiff;
    ageDiff <== currentTime - birthdate;
    
    // Convert age to years (integer division)
    signal ageInYears;
    ageInYears <-- ageDiff \ SECONDS_PER_YEAR;
    
    // Verify the division is correct
    signal ageCheck;
    ageCheck <== ageInYears * SECONDS_PER_YEAR;
    
    // Check that ageCheck <= ageDiff < ageCheck + SECONDS_PER_YEAR
    component lessThanUpper = LessThan(64);
    lessThanUpper.in[0] <== ageDiff;
    lessThanUpper.in[1] <== ageCheck + SECONDS_PER_YEAR;
    lessThanUpper.out === 1;
    
    component greaterEqLower = GreaterEqThan(64);
    greaterEqLower.in[0] <== ageDiff;
    greaterEqLower.in[1] <== ageCheck;
    greaterEqLower.out === 1;
    
    // Check if age meets minimum requirement
    component ageComparator = GreaterEqThan(32);
    ageComparator.in[0] <== ageInYears;
    ageComparator.in[1] <== minAge;
    ageValid <== ageComparator.out;
    
    // Generate nullifier to prevent reuse
    component nullifierHash = Poseidon(3);
    nullifierHash.inputs[0] <== birthdate;
    nullifierHash.inputs[1] <== randomness;
    nullifierHash.inputs[2] <== minAge;
    nullifier <== nullifierHash.out;
    
    // Verify commitment (optional - can verify passport data integrity)
    component commitmentCheck = Poseidon(2);
    commitmentCheck.inputs[0] <== birthdate;
    commitmentCheck.inputs[1] <== randomness;
    commitment === commitmentCheck.out;
}

component main {public [currentTime, minAge, commitment]} = AgeRangeProof();
