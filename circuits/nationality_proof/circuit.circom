pragma circom 2.1.6;

include "circomlib/circuits/poseidon.circom";

// Nationality proof circuit
// Proves citizenship/nationality without revealing passport details

template NationalityProof() {
    // Public inputs
    signal input commitment;           // Hash of passport data
    signal input nullifier;            // Unique identifier
    signal input allowedNationality;   // Required nationality code

    // Private inputs
    signal input passportNumber;       // Passport number
    signal input nationality;          // Actual nationality code
    signal input salt;                 // Random salt

    // Create commitment
    signal commitmentInput[3];
    commitmentInput[0] <== passportNumber;
    commitmentInput[1] <== nationality;
    commitmentInput[2] <== salt;
    signal calculatedCommitment <== Poseidon(3)(commitmentInput);

    // Create nullifier
    signal calculatedNullifier <== Poseidon(1)([passportNumber]);

    // Constraints
    commitment === calculatedCommitment;
    nullifier === calculatedNullifier;
    nationality === allowedNationality;
}

component main {public [commitment, nullifier, allowedNationality]} = NationalityProof();