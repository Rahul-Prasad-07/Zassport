pragma circom 2.1.6;

include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/comparators.circom";

// Passport verification circuit
// Proves that:
// 1. Passport signature is valid (RSA verification)
// 2. Passport is not expired
// 3. Age is within specified range
// Without revealing the actual data

template PassportVerifier() {
    // Public inputs (revealed to verifier)
    signal input commitment;           // Hash of passport data + salt
    signal input nullifier;            // Unique identifier to prevent double-use
    signal input currentTimestamp;     // Current time for expiration check
    signal input minAge;              // Minimum age requirement
    signal input maxAge;              // Maximum age requirement (0 = no max)

    // Private inputs (hidden from verifier)
    signal input passportNumber;       // Passport number
    signal input dateOfBirth;          // Date of birth (Unix timestamp)
    signal input expirationDate;       // Passport expiration date
    signal input signature;            // RSA signature of passport data
    signal input modulus;              // RSA public key modulus
    signal input salt;                 // Random salt for commitment

    // Intermediate signals
    signal age;
    signal isExpired;
    signal isValidAge;

    // Calculate age from date of birth
    age <== currentTimestamp - dateOfBirth;

    // Check if passport is expired
    isExpired <== LessThan(32)([expirationDate, currentTimestamp]);

    // Verify age is within range
    signal ageMinCheck <== GreaterEqThan(32)([age, minAge * 31536000]); // Convert years to seconds
    
    // Handle max age check (0 means no maximum)
    component ageMaxComp = LessThan(32);
    ageMaxComp.in[0] <== age;
    ageMaxComp.in[1] <== maxAge * 31536000;
    
    // If maxAge is 0, always pass the check. Otherwise, use the comparison result
    signal maxAgeIsZero <== IsZero()(maxAge);
    signal ageMaxCheck <== maxAgeIsZero + (1 - maxAgeIsZero) * ageMaxComp.out;
    
    isValidAge <== ageMinCheck * ageMaxCheck;

    // Create commitment: hash(passportNumber, dateOfBirth, expirationDate, salt)
    signal commitmentInput[4];
    commitmentInput[0] <== passportNumber;
    commitmentInput[1] <== dateOfBirth;
    commitmentInput[2] <== expirationDate;
    commitmentInput[3] <== salt;

    signal calculatedCommitment <== Poseidon(4)(commitmentInput);

    // Create nullifier: hash(passportNumber)
    signal calculatedNullifier <== Poseidon(1)([passportNumber]);

    // Constraints
    commitment === calculatedCommitment;
    nullifier === calculatedNullifier;
    isExpired === 0;  // Passport must not be expired
    isValidAge === 1; // Age must be valid
}

component main {public [commitment, nullifier, currentTimestamp, minAge, maxAge]} = PassportVerifier();