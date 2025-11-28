use anchor_lang::prelude::*;
use core::convert::TryInto;
use groth16_solana::{
    decompression::{decompress_g1, decompress_g2},
    errors::Groth16Error,
    groth16::{Groth16Verifier, Groth16Verifyingkey},
};

pub mod verification_keys;
pub mod test_vectors;


use verification_keys::{AGE_PROOF_VK, NATIONALITY_PROOF_VK, PASSPORT_VERIFIER_VK};

const G1_COMPRESSED_BYTES: usize = 32;
const G2_COMPRESSED_BYTES: usize = 64;
const G1_UNCOMPRESSED_BYTES: usize = 64;
const G2_UNCOMPRESSED_BYTES: usize = 128;
const COMPRESSED_PROOF_BYTES: usize = G1_COMPRESSED_BYTES * 2 + G2_COMPRESSED_BYTES;
const UNCOMPRESSED_PROOF_BYTES: usize = G1_UNCOMPRESSED_BYTES * 2 + G2_UNCOMPRESSED_BYTES;
const BN254_PRIME: [u8; 32] = [
    48, 100, 78, 114, 225, 49, 160, 41, 184, 80, 69, 182, 129, 129, 88, 93, 40, 51, 232, 72, 121,
    185, 112, 145, 67, 225, 245, 147, 240, 0, 0, 1,
];

fn swap_endianness_chunks<const N: usize, const CHUNK: usize>(value: &[u8; N]) -> [u8; N] {
    debug_assert_eq!(N % CHUNK, 0);
    let mut swapped = [0u8; N];
    for (chunk_index, chunk) in value.chunks(CHUNK).enumerate() {
        let start = chunk_index * CHUNK;
        for (i, _) in chunk.iter().enumerate() {
            swapped[start + i] = chunk[CHUNK - 1 - i];
        }
    }
    swapped
}

fn swap_g1_endianness(value: &[u8; G1_UNCOMPRESSED_BYTES]) -> [u8; G1_UNCOMPRESSED_BYTES] {
    swap_endianness_chunks::<G1_UNCOMPRESSED_BYTES, 32>(value)
}

fn swap_g2_endianness(value: &[u8; G2_UNCOMPRESSED_BYTES]) -> [u8; G2_UNCOMPRESSED_BYTES] {
    swap_endianness_chunks::<G2_UNCOMPRESSED_BYTES, 64>(value)
}

struct ParsedProof {
    proof_a: [u8; G1_UNCOMPRESSED_BYTES],
    proof_b: [u8; G2_UNCOMPRESSED_BYTES],
    proof_c: [u8; G1_UNCOMPRESSED_BYTES],
}

/// Splits and (if necessary) decompresses proof bytes into uncompressed G1/G2 elements.
fn parse_proof_bytes(proof_bytes: &[u8]) -> Result<ParsedProof> {
    match proof_bytes.len() {
        UNCOMPRESSED_PROOF_BYTES => {
            let proof_a_raw =
                slice_to_array::<G1_UNCOMPRESSED_BYTES>(&proof_bytes[..G1_UNCOMPRESSED_BYTES])?;
            let proof_b = slice_to_array::<G2_UNCOMPRESSED_BYTES>(
                &proof_bytes[G1_UNCOMPRESSED_BYTES..G1_UNCOMPRESSED_BYTES + G2_UNCOMPRESSED_BYTES],
            )?;
            let proof_c = slice_to_array::<G1_UNCOMPRESSED_BYTES>(
                &proof_bytes[G1_UNCOMPRESSED_BYTES + G2_UNCOMPRESSED_BYTES..],
            )?;

            // Convert proof A from snarkjs format (negate y)
            let proof_a = convert_proof_a_from_snarkjs(&proof_a_raw);

            Ok(ParsedProof {
                proof_a,
                proof_b,
                proof_c,
            })
        }
        COMPRESSED_PROOF_BYTES => {
            let proof_a_compressed =
                slice_to_array::<G1_COMPRESSED_BYTES>(&proof_bytes[..G1_COMPRESSED_BYTES])?;
            let proof_b_compressed = slice_to_array::<G2_COMPRESSED_BYTES>(
                &proof_bytes[G1_COMPRESSED_BYTES..G1_COMPRESSED_BYTES + G2_COMPRESSED_BYTES],
            )?;
            let proof_c_compressed = slice_to_array::<G1_COMPRESSED_BYTES>(
                &proof_bytes[G1_COMPRESSED_BYTES + G2_COMPRESSED_BYTES..],
            )?;

            // Quick malformed guard: zeroed compressed elements are invalid
            if proof_a_compressed.iter().all(|&b| b == 0)
                || proof_b_compressed.iter().all(|&b| b == 0)
                || proof_c_compressed.iter().all(|&b| b == 0)
            {
                return Err(error!(crate::errors::ZKPassportError::InvalidProof));
            }

            let proof_a_raw = decompress_g1(&proof_a_compressed).map_err(map_groth16_error)?;
            let proof_b = decompress_g2(&proof_b_compressed).map_err(map_groth16_error)?;
            let proof_c = decompress_g1(&proof_c_compressed).map_err(map_groth16_error)?;

            // Convert proof A from snarkjs format (negate y)
            let proof_a = convert_proof_a_from_snarkjs(&proof_a_raw);

            Ok(ParsedProof {
                proof_a,
                proof_b,
                proof_c,
            })
        }
        _ => Err(error!(crate::errors::ZKPassportError::InvalidProof)),
    }
}

fn slice_to_array<const N: usize>(bytes: &[u8]) -> Result<[u8; N]> {
    bytes
        .try_into()
        .map_err(|_| error!(crate::errors::ZKPassportError::InvalidProof))
}

fn negate_g1_y(point: &mut [u8; G1_UNCOMPRESSED_BYTES]) {
    let (_, y_bytes) = point.split_at_mut(32);
    negate_field_element_in_place(y_bytes);
}

pub fn negate_field_element_in_place(value: &mut [u8]) {
    debug_assert_eq!(value.len(), 32);

    if value.iter().all(|byte| *byte == 0) {
        return;
    }

    // BN254 prime in LE for LE arithmetic
    const BN254_PRIME_LE: [u8; 32] = [
        1, 0, 0, 240, 147, 245, 225, 67, 145, 112, 185, 121, 72, 232, 51, 40, 93, 88, 129, 129,
        182, 69, 80, 184, 41, 160, 49, 225, 114, 78, 100, 48,
    ];

    let mut borrow = 0u16;
    for i in 0..32 {
        let modulus = BN254_PRIME_LE[i] as u16;
        let val = value[i] as u16;
        let diff = modulus.wrapping_sub(val).wrapping_sub(borrow);
        value[i] = (diff & 0xff) as u8;
        borrow = if diff > 0xff { 1 } else { 0 };
    }
}

fn convert_snarkjs_g2_to_alt(point: [u8; G2_UNCOMPRESSED_BYTES]) -> [u8; G2_UNCOMPRESSED_BYTES] {
    let mut reordered = [0u8; G2_UNCOMPRESSED_BYTES];
    reordered[..32].copy_from_slice(&point[32..64]);
    reordered[32..64].copy_from_slice(&point[..32]);
    reordered[64..96].copy_from_slice(&point[96..128]);
    reordered[96..].copy_from_slice(&point[64..96]);
    reordered
}

/// Convert proof A from snarkjs (BE limbs) to groth16-solana format:
/// Negate y-coordinate: swap endianness, negate in LE, swap back.
fn convert_proof_a_from_snarkjs(
    proof_a_be: &[u8; G1_UNCOMPRESSED_BYTES],
) -> [u8; G1_UNCOMPRESSED_BYTES] {
    let mut result = *proof_a_be;
    
    // Negate y coordinate (bytes 32-63) modulo BN254 prime
    let (_, y_bytes) = result.split_at_mut(32);
    
    // Change endianness of y
    y_bytes.reverse();
    
    // Negate in LE
    negate_field_element_in_place(y_bytes);
    
    // Change endianness back
    y_bytes.reverse();
    
    result
}

fn map_groth16_error(err: Groth16Error) -> anchor_lang::error::Error {
    use crate::errors::ZKPassportError;

    let code = match err {
        Groth16Error::InvalidG1Length
        | Groth16Error::InvalidG2Length
        | Groth16Error::InvalidPublicInputsLength
        | Groth16Error::DecompressingG1Failed
        | Groth16Error::DecompressingG2Failed => ZKPassportError::InvalidProof,
        _ => ZKPassportError::ProofVerificationFailed,
    };

    error!(code)
}

fn i64_to_field_element_bytes(value: i64) -> [u8; 32] {
    let mut bytes = [0u8; 32];
    bytes[24..].copy_from_slice(&value.to_be_bytes());
    bytes
}

fn u64_to_field_element_bytes(value: u64) -> [u8; 32] {
    let mut bytes = [0u8; 32];
    bytes[24..].copy_from_slice(&value.to_be_bytes());
    bytes
}

/// Verify a Groth16 proof on-chain using groth16-solana primitives.
pub fn verify_groth16_proof<const N: usize>(
    proof_bytes: &[u8],
    public_inputs: &[[u8; 32]; N],
    vk: &'static Groth16Verifyingkey<'static>,
) -> Result<bool> {
    require_eq!(
        vk.nr_pubinputs,
        N,
        crate::errors::ZKPassportError::InvalidVerificationKey
    );

    let parsed = parse_proof_bytes(proof_bytes)?;
    let mut verifier = Groth16Verifier::new(
        &parsed.proof_a,
        &parsed.proof_b,
        &parsed.proof_c,
        public_inputs,
        vk,
    )
    .map_err(map_groth16_error)?;

    verifier.verify().map_err(map_groth16_error)?;
    Ok(true)
}

/// Verify age proof with commitment, nullifier, timestamp, and age range
pub fn verify_age_proof_groth16(
    proof: &[u8],
    commitment: [u8; 32],
    nullifier: [u8; 32],
    current_timestamp: i64,
    min_age: u64,
    max_age: u64,
) -> Result<bool> {
    let public_inputs = [
        commitment,
        nullifier,
        i64_to_field_element_bytes(current_timestamp),
        u64_to_field_element_bytes(min_age),
        u64_to_field_element_bytes(max_age),
    ];

    verify_groth16_proof(proof, &public_inputs, &AGE_PROOF_VK)
}

/// Verify nationality proof with commitment, nullifier, and allowed nationality
pub fn verify_nationality_proof_groth16(
    proof: &[u8],
    commitment: [u8; 32],
    nullifier: [u8; 32],
    allowed_nationality: u64,
) -> Result<bool> {
    let public_inputs = [
        commitment,
        nullifier,
        u64_to_field_element_bytes(allowed_nationality),
    ];

    verify_groth16_proof(proof, &public_inputs, &NATIONALITY_PROOF_VK)
}

/// Verify full passport proof
pub fn verify_passport_proof_groth16(
    proof: &[u8],
    commitment: [u8; 32],
    nullifier: [u8; 32],
    current_timestamp: i64,
    min_age: u64,
    max_age: u64,
) -> Result<bool> {
    let public_inputs = [
        commitment,
        nullifier,
        i64_to_field_element_bytes(current_timestamp),
        u64_to_field_element_bytes(min_age),
        u64_to_field_element_bytes(max_age),
    ];

    verify_groth16_proof(proof, &public_inputs, &PASSPORT_VERIFIER_VK)
}

#[cfg(test)]
mod fixtures;

#[cfg(test)]
mod tests {
    use super::*;
    use crate::errors::ZKPassportError;
    use anchor_lang::error::Error;
    use fixtures::*;
    use solana_bn254::compression::prelude::{alt_bn128_g1_compress, alt_bn128_g2_compress};

    fn swap_endianness_chunks<const N: usize, const CHUNK: usize>(value: &[u8; N]) -> [u8; N] {
        debug_assert_eq!(N % CHUNK, 0);
        let mut swapped = [0u8; N];
        for (chunk_index, chunk) in value.chunks(CHUNK).enumerate() {
            let start = chunk_index * CHUNK;
            for (i, _) in chunk.iter().enumerate() {
                swapped[start + i] = chunk[CHUNK - 1 - i];
            }
        }
        swapped
    }

    fn swap_g1_endianness(value: &[u8; G1_UNCOMPRESSED_BYTES]) -> [u8; G1_UNCOMPRESSED_BYTES] {
        swap_endianness_chunks::<G1_UNCOMPRESSED_BYTES, 32>(value)
    }

    fn swap_g2_endianness(value: &[u8; G2_UNCOMPRESSED_BYTES]) -> [u8; G2_UNCOMPRESSED_BYTES] {
        swap_endianness_chunks::<G2_UNCOMPRESSED_BYTES, 64>(value)
    }

    fn assert_error_code(err: Error, code: ZKPassportError) {
        match err {
            Error::AnchorError(anchor_err) => {
                let expected: u32 = code.into();
                assert_eq!(anchor_err.error_code_number, expected);
            }
            other => panic!("unexpected error variant: {other:?}"),
        }
    }

    #[test]
    fn rejects_invalid_proof_length() {
        let proof = vec![0u8; 42];
        let commitment = [0u8; 32];
        let nullifier = [0u8; 32];

        let err = verify_age_proof_groth16(&proof, commitment, nullifier, 1, 18, 120)
            .expect_err("invalid proof length should error");

        assert_error_code(err, ZKPassportError::InvalidProof);
    }

    #[test]
    fn rejects_malformed_compressed_proof() {
        let proof = vec![0u8; COMPRESSED_PROOF_BYTES];
        let commitment = [1u8; 32];
        let nullifier = [2u8; 32];

        let err = verify_nationality_proof_groth16(&proof, commitment, nullifier, 840)
            .expect_err("malformed proof should error");

        assert_error_code(err, ZKPassportError::InvalidProof);
    }

    #[test]
    fn age_fixture_verifies_with_uncompressed_proof() {
        let commitment = AGE_PUBLIC_INPUTS[0];
        let nullifier = AGE_PUBLIC_INPUTS[1];

        let result = verify_age_proof_groth16(
            &AGE_PROOF_BYTES,
            commitment,
            nullifier,
            1_704_067_200,
            21,
            65,
        )
        .expect("proof should verify");

        assert!(result);
    }

    #[test]
    fn age_fixture_verifies_with_compressed_proof() {
        let (proof_a, rest) = AGE_PROOF_BYTES.split_at(G1_UNCOMPRESSED_BYTES);
        let (proof_b, proof_c) = rest.split_at(G2_UNCOMPRESSED_BYTES);
        let proof_a: [u8; G1_UNCOMPRESSED_BYTES] = proof_a.try_into().unwrap();
        let proof_b: [u8; G2_UNCOMPRESSED_BYTES] = proof_b.try_into().unwrap();
        let proof_c: [u8; G1_UNCOMPRESSED_BYTES] = proof_c.try_into().unwrap();

        let compressed_a = alt_bn128_g1_compress(&proof_a).unwrap();
        let compressed_b = alt_bn128_g2_compress(&proof_b).unwrap();
        let compressed_c = alt_bn128_g1_compress(&proof_c).unwrap();

        let compressed_proof: Vec<u8> = [
            compressed_a.as_slice(),
            compressed_b.as_slice(),
            compressed_c.as_slice(),
        ]
        .concat();

        let commitment = AGE_PUBLIC_INPUTS[0];
        let nullifier = AGE_PUBLIC_INPUTS[1];

        let result = verify_age_proof_groth16(
            &compressed_proof,
            commitment,
            nullifier,
            1_704_067_200,
            21,
            65,
        )
        .expect("compressed proof should verify");

        assert!(result);
    }

    #[test]
    fn nationality_fixture_verifies() {
        let commitment = NATIONALITY_PUBLIC_INPUTS[0];
        let nullifier = NATIONALITY_PUBLIC_INPUTS[1];

        let result =
            verify_nationality_proof_groth16(&NATIONALITY_PROOF_BYTES, commitment, nullifier, 840)
                .expect("nationality proof should verify");

        assert!(result);
    }

    #[test]
    fn passport_fixture_verifies() {
        let commitment = PASSPORT_PUBLIC_INPUTS[0];
        let nullifier = PASSPORT_PUBLIC_INPUTS[1];

        let result = verify_passport_proof_groth16(
            &PASSPORT_PROOF_BYTES,
            commitment,
            nullifier,
            1_704_067_200,
            18,
            65,
        )
        .expect("passport proof should verify");

        assert!(result);
    }
}
