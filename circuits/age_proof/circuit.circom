pragma circom 2.1.6;

include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/comparators.circom";

// Age range proof circuit
// Proves that a person is within a certain age range
// without revealing their exact age

template AgeProof() {
    // Public inputs
    signal input commitment;           // Hash of personal data
    signal input nullifier;            // Unique identifier
    signal input currentTimestamp;     // Current time
    signal input minAge;              // Minimum age
    signal input maxAge;              // Maximum age

    // Private inputs
    signal input dateOfBirth;          // Actual date of birth
    signal input salt;                 // Random salt

    // Constants
    signal SECONDS_PER_YEAR <== 31536000;

    // Calculate age bounds
    // Person must be at least minAge: dateOfBirth <= currentTimestamp - minAge * SECONDS_PER_YEAR
    // Person must be at most maxAge: dateOfBirth >= currentTimestamp - maxAge * SECONDS_PER_YEAR

    signal minAgeSeconds <== minAge * SECONDS_PER_YEAR;
    signal maxAgeSeconds <== maxAge * SECONDS_PER_YEAR;

    signal minAgeThreshold <== currentTimestamp - minAgeSeconds;
    signal maxAgeThreshold <== currentTimestamp - maxAgeSeconds;

    // Check age range constraints
    signal minCheck <== LessEqThan(64)([dateOfBirth, minAgeThreshold]);
    signal maxCheck <== GreaterEqThan(64)([dateOfBirth, maxAgeThreshold]);

    // Create commitment
    signal commitmentInput[2];
    commitmentInput[0] <== dateOfBirth;
    commitmentInput[1] <== salt;
    signal calculatedCommitment <== Poseidon(2)(commitmentInput);

    // Create nullifier (hash of commitment for uniqueness)
    signal calculatedNullifier <== Poseidon(1)([commitment]);

    // Constraints
    commitment === calculatedCommitment;
    nullifier === calculatedNullifier;
    minCheck === 1;
    maxCheck === 1;
}

component main {public [commitment, nullifier, currentTimestamp, minAge, maxAge]} = AgeProof();