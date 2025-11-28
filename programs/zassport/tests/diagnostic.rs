/// Minimal diagnostic test using reference PROOF constant from groth16-solana
/// This will help isolate whether the issue is our proof or our verifier setup
use groth16_solana::{
    groth16::Groth16Verifier,
    groth16::Groth16Verifyingkey,
};
use zassport::zk_verifier::{test_vectors::AGE_PROOF_BYTES, negate_field_element_in_place};

// This is a known-good PROOF constant from groth16-solana tests
// It's already in the correct format (proof A is negated, all in BE)
const REFERENCE_PROOF: [u8; 256] = [
    // This should be replaced with actual reference proof
    // For now, using our age proof to test
    10, 172, 254, 154, 231, 166, 140, 70, 43, 24, 45, 83, 196, 232, 102, 112,
    167, 29, 217, 71, 254, 164, 148, 196, 222, 114, 109, 237, 44, 108, 46, 161,
    11, 105, 219, 236, 71, 213, 247, 166, 249, 106, 167, 149, 11, 97, 184, 19,
    15, 118, 129, 183, 239, 89, 223, 109, 19, 75, 229, 146, 239, 241, 207, 189,
    20, 188, 243, 174, 25, 63, 114, 231, 232, 142, 81, 233, 216, 81, 42, 176,
    234, 225, 79, 114, 141, 16, 92, 3, 247, 37, 169, 245, 240, 189, 75, 63,
    13, 108, 9, 153, 103, 57, 40, 148, 129, 139, 152, 191, 141, 11, 37, 168,
    175, 4, 64, 70, 236, 6, 155, 68, 162, 154, 15, 141, 75, 190, 242, 216,
    38, 161, 106, 93, 192, 72, 61, 212, 138, 230, 183, 60, 170, 174, 39, 34,
    32, 156, 147, 88, 124, 248, 54, 17, 55, 158, 253, 103, 16, 231, 241, 142,
    15, 142, 216, 140, 28, 81, 109, 210, 81, 191, 66, 26, 68, 101, 220, 156,
    110, 158, 8, 116, 204, 100, 7, 205, 147, 181, 223, 236, 253, 213, 169, 243,
    10, 66, 200, 152, 103, 182, 90, 145, 45, 154, 22, 130, 33, 173, 130, 253,
    149, 24, 145, 75, 226, 23, 217, 16, 164, 50, 49, 150, 22, 74, 145, 124,
    8, 138, 79, 238, 54, 183, 153, 94, 62, 199, 45, 73, 213, 176, 109, 46,
    103, 148, 231, 161, 184, 8, 224, 161, 132, 100, 47, 185, 88, 141, 225, 172
];

// A simple test VK - using age proof VK
const TEST_VK: Groth16Verifyingkey = Groth16Verifyingkey {
    nr_pubinputs: 5,
    vk_alpha_g1: [
        10, 186, 227, 26, 86, 208, 154, 75, 21, 229, 173, 139, 145, 59, 245, 247,
        42, 12, 232, 30, 11, 161, 131, 35, 133, 14, 191, 181, 69, 207, 199, 62,
        5, 161, 82, 41, 185, 196, 91, 106, 203, 62, 176, 23, 40, 251, 184, 120,
        103, 102, 12, 108, 138, 55, 50, 233, 16, 23, 42, 40, 57, 140, 21, 31
    ],
    vk_beta_g2: [
        37, 236, 84, 174, 214, 76, 170, 246, 188, 211, 66, 28, 247, 176, 56, 172,
        167, 140, 190, 207, 192, 243, 165, 237, 194, 208, 206, 78, 84, 38, 37, 66,
        28, 8, 32, 197, 132, 45, 241, 218, 186, 224, 147, 44, 184, 70, 247, 226,
        16, 142, 140, 97, 58, 96, 175, 112, 189, 155, 105, 95, 117, 223, 228, 252,
        37, 43, 146, 152, 93, 79, 72, 22, 177, 43, 253, 43, 38, 152, 48, 14,
        57, 209, 189, 226, 192, 132, 162, 52, 199, 208, 248, 203, 98, 87, 61, 61,
        3, 37, 64, 115, 193, 24, 149, 137, 242, 210, 193, 223, 244, 12, 108, 140,
        144, 202, 63, 152, 247, 70, 49, 156, 87, 251, 96, 50, 22, 48, 137, 137
    ],
    vk_gamme_g2: [  // Note: intentional typo in groth16-solana crate
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        25, 142, 32, 254, 148, 2, 169, 226, 139, 140, 182, 148, 119, 148, 95, 58,
        71, 110, 94, 21, 84, 244, 142, 44, 192, 66, 23, 231, 118, 47, 251, 148,
        19, 8, 139, 33, 211, 18, 237, 160, 68, 35, 223, 116, 112, 135, 181, 43,
        79, 167, 184, 86, 118, 109, 255, 201, 145, 55, 154, 197, 233, 235, 25, 100,
        13, 0, 176, 106, 228, 33, 220, 158, 207, 127, 200, 215, 185, 49, 122, 68,
        164, 245, 93, 248, 61, 66, 105, 173, 45, 85, 142, 43, 178, 186, 146, 199
    ],
    vk_delta_g2: [
        31, 10, 12, 53, 66, 181, 166, 200, 81, 217, 246, 160, 165, 176, 237, 152,
        169, 205, 47, 200, 102, 171, 240, 246, 213, 105, 86, 45, 129, 59, 112, 200,
        17, 32, 251, 18, 8, 227, 152, 25, 74, 25, 189, 229, 237, 133, 12, 3,
        63, 252, 120, 141, 159, 104, 183, 239, 248, 95, 56, 72, 63, 191, 92, 124,
        19, 64, 166, 184, 178, 45, 61, 91, 105, 236, 42, 17, 219, 22, 247, 45,
        102, 173, 39, 89, 47, 47, 35, 156, 14, 89, 30, 156, 173, 221, 132, 166,
        34, 93, 227, 229, 178, 213, 120, 180, 196, 239, 254, 86, 57, 113, 50, 78,
        106, 17, 145, 48, 48, 37, 103, 254, 62, 232, 223, 207, 84, 76, 5, 197
    ],
    vk_ic: &[
        [
            3, 213, 206, 150, 254, 159, 224, 165, 6, 188, 164, 33, 5, 149, 238, 62,
            209, 66, 154, 27, 26, 51, 240, 63, 234, 226, 43, 6, 23, 138, 51, 113,
            40, 229, 240, 115, 205, 196, 142, 239, 134, 121, 245, 65, 253, 207, 180, 124,
            133, 158, 18, 137, 89, 247, 130, 236, 73, 114, 66, 164, 154, 179, 65, 12
        ],
        [
            41, 131, 36, 211, 142, 96, 26, 159, 158, 5, 191, 175, 249, 162, 97, 205,
            34, 8, 20, 200, 161, 248, 236, 24, 120, 134, 131, 255, 235, 55, 157, 35,
            41, 163, 126, 182, 94, 134, 249, 12, 80, 245, 162, 123, 213, 186, 140, 152,
            20, 224, 189, 150, 124, 177, 240, 107, 222, 176, 230, 48, 112, 77, 26, 36
        ],
        [
            41, 58, 125, 9, 145, 205, 49, 65, 119, 152, 67, 149, 10, 143, 51, 239,
            74, 23, 132, 161, 133, 20, 33, 18, 150, 229, 251, 99, 172, 84, 241, 60,
            31, 219, 127, 204, 207, 6, 180, 76, 40, 22, 201, 202, 111, 52, 147, 133,
            157, 214, 73, 236, 176, 95, 208, 128, 46, 116, 183, 84, 98, 45, 200, 176
        ],
        [
            19, 242, 225, 163, 29, 49, 111, 105, 87, 98, 58, 183, 34, 229, 225, 151,
            78, 41, 211, 162, 222, 25, 126, 94, 36, 146, 231, 215, 170, 127, 146, 43,
            38, 179, 74, 74, 35, 162, 184, 69, 154, 198, 5, 92, 201, 106, 184, 14,
            141, 188, 244, 246, 240, 150, 64, 197, 224, 55, 59, 67, 239, 237, 119, 209
        ],
        [
            26, 74, 186, 52, 93, 146, 248, 37, 208, 31, 85, 129, 112, 36, 212, 86,
            253, 157, 19, 167, 181, 48, 245, 40, 249, 150, 226, 118, 138, 197, 36, 66,
            32, 215, 179, 48, 97, 179, 12, 195, 191, 45, 171, 17, 49, 116, 59, 10,
            112, 26, 173, 73, 204, 3, 36, 74, 35, 54, 8, 209, 204, 178, 201, 94
        ],
        [
            2, 100, 156, 99, 220, 50, 89, 130, 224, 200, 249, 4, 52, 155, 170, 233,
            94, 56, 159, 230, 141, 234, 45, 197, 255, 224, 112, 51, 175, 173, 57, 242,
            38, 16, 34, 114, 8, 123, 181, 168, 171, 205, 191, 128, 102, 187, 137, 89,
            43, 182, 155, 156, 235, 77, 40, 192, 163, 54, 139, 231, 126, 61, 222, 158
        ]
    ],
};

// Test public inputs for age proof
const TEST_PUBLIC_INPUTS: [[u8; 32]; 5] = [
    [
        46, 36, 235, 177, 26, 32, 37, 155, 154, 136, 231, 153, 111, 97, 74, 16,
        115, 151, 245, 115, 124, 219, 76, 66, 221, 116, 170, 208, 9, 177, 156, 228
    ],
    [
        15, 167, 245, 16, 202, 50, 194, 69, 52, 19, 197, 80, 161, 99, 199, 78,
        136, 171, 170, 154, 87, 17, 194, 127, 43, 143, 135, 189, 237, 55, 141, 248
    ],
    [
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 101, 146, 0, 128
    ],
    [
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 21
    ],
    [
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 65
    ]
];

#[test]
fn test_verifier_setup_with_our_proof() {
    // Test with our actual proof (already negated in AGE_PROOF_BYTES)
    
    let proof_a: [u8; 64] = AGE_PROOF_BYTES[0..64].try_into().unwrap();
    let proof_b: [u8; 128] = AGE_PROOF_BYTES[64..192].try_into().unwrap();
    let proof_c: [u8; 64] = AGE_PROOF_BYTES[192..256].try_into().unwrap();

    println!("\n=== Testing with our proof ===");
    println!("proof_a first 8 bytes: {:?}", &proof_a[0..8]);
    
    let result = Groth16Verifier::new(
        &proof_a,
        &proof_b,
        &proof_c,
        &TEST_PUBLIC_INPUTS,
        &TEST_VK,
    );

    match result {
        Ok(mut verifier) => {
            println!("✓ Verifier created successfully");
            match verifier.verify() {
                Ok(_) => println!("✓ VERIFICATION PASSED!"),
                Err(e) => println!("✗ Verification failed: {:?}", e),
            }
        }
        Err(e) => {
            println!("✗ Failed to create verifier: {:?}", e);
        }
    }
}

#[test]
fn test_raw_proof_without_negation() {
    // Get original snarkjs proof without negation
    
    let mut proof_a: [u8; 64] = AGE_PROOF_BYTES[0..64].try_into().unwrap();
    
    // Reverse the y-coordinate back to original
    // Our AGE_PROOF_BYTES has negated y already, so "un-negate" it
    let mut y_coord = [0u8; 32];
    y_coord.copy_from_slice(&proof_a[32..64]);
    
    // To undo negation: negate again (since -(-y) = y)
    negate_field_element_in_place(&mut y_coord);
    proof_a[32..64].copy_from_slice(&y_coord);
    
    let proof_b: [u8; 128] = AGE_PROOF_BYTES[64..192].try_into().unwrap();
    let proof_c: [u8; 64] = AGE_PROOF_BYTES[192..256].try_into().unwrap();

    println!("\n=== Testing with RAW (non-negated) proof ===");
    println!("proof_a y-coord first 8 bytes: {:?}", &proof_a[32..40]);
    
    let result = Groth16Verifier::new(
        &proof_a,
        &proof_b,
        &proof_c,
        &TEST_PUBLIC_INPUTS,
        &TEST_VK,
    );

    match result {
        Ok(mut verifier) => {
            println!("✓ Verifier created successfully");
            match verifier.verify() {
                Ok(_) => println!("✓ RAW PROOF PASSED! (This would be unexpected)"),
                Err(e) => println!("✗ Raw proof verification failed as expected: {:?}", e),
            }
        }
        Err(e) => {
            println!("✗ Failed to create verifier: {:?}", e);
        }
    }
}

#[test]
fn test_proof_components() {
    
    println!("\n=== Analyzing Proof Components ===");
    
    let proof_a_x = &AGE_PROOF_BYTES[0..32];
    let proof_a_y = &AGE_PROOF_BYTES[32..64];
    let proof_b_c1_x = &AGE_PROOF_BYTES[64..96];
    let proof_b_c1_y = &AGE_PROOF_BYTES[96..128];
    let proof_b_c0_x = &AGE_PROOF_BYTES[128..160];
    let proof_b_c0_y = &AGE_PROOF_BYTES[160..192];
    let proof_c_x = &AGE_PROOF_BYTES[192..224];
    let proof_c_y = &AGE_PROOF_BYTES[224..256];
    
    fn to_hex(bytes: &[u8]) -> String {
        bytes.iter().map(|b| format!("{:02x}", b)).collect::<String>()
    }
    
    println!("Proof A:");
    println!("  x: {}", to_hex(proof_a_x));
    println!("  y: {}", to_hex(proof_a_y));
    
    println!("\nProof B (G2 point in alt order c1, c0):");
    println!("  c1.x: {}", to_hex(proof_b_c1_x));
    println!("  c1.y: {}", to_hex(proof_b_c1_y));
    println!("  c0.x: {}", to_hex(proof_b_c0_x));
    println!("  c0.y: {}", to_hex(proof_b_c0_y));
    
    println!("\nProof C:");
    println!("  x: {}", to_hex(proof_c_x));
    println!("  y: {}", to_hex(proof_c_y));
    
    // Check if any coordinates are all zeros (invalid)
    let is_zero = |bytes: &[u8]| bytes.iter().all(|&b| b == 0);
    
    if is_zero(proof_a_x) || is_zero(proof_a_y) {
        println!("\n⚠ WARNING: Proof A has zero coordinate!");
    }
    if is_zero(proof_c_x) || is_zero(proof_c_y) {
        println!("\n⚠ WARNING: Proof C has zero coordinate!");
    }
}
