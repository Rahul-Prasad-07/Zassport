const circomlibjs = require('circomlibjs');

async function calculateHashes() {
    const poseidon = await circomlibjs.buildPoseidon();

    // Passport verifier
    const passportInputs = [123456789n, 1041379200n, 1735689600n, 1111111111111111111111111111111111111111n];
    const passportCommitment = poseidon(passportInputs);
    const passportNullifier = poseidon([123456789n]);

    console.log('Passport commitment:', poseidon.F.toString(passportCommitment));
    console.log('Passport nullifier:', poseidon.F.toString(passportNullifier));

    // Age proof
    const ageInputs = [1041379200n, 1111111111111111111111111111111111111111n];
    const ageCommitment = poseidon(ageInputs);
    const ageNullifier = poseidon([ageCommitment]);

    console.log('Age commitment:', poseidon.F.toString(ageCommitment));
    console.log('Age nullifier:', poseidon.F.toString(ageNullifier));

    // Nationality proof
    const nationalityInputs = [123456789n, 840n, 1111111111111111111111111111111111111111n];
    const nationalityCommitment = poseidon(nationalityInputs);
    const nationalityNullifier = poseidon([123456789n]);

    console.log('Nationality commitment:', poseidon.F.toString(nationalityCommitment));
    console.log('Nationality nullifier:', poseidon.F.toString(nationalityNullifier));
}

calculateHashes();