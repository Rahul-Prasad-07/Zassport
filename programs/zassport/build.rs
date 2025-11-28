// Build script to check for witness generators

use std::path::Path;

fn main() {
    println!("cargo:rerun-if-changed=../../circuits/age_proof/build/circuit_js");
    println!("cargo:rerun-if-changed=../../circuits/nationality_proof/build/circuit_js");
    println!("cargo:rerun-if-changed=../../circuits/passport_verifier/build/circuit_js");
    
    // Check if witness generators exist
    check_witness("age_proof");
    check_witness("nationality_proof");
    check_witness("passport_verifier");
    
    println!("cargo:warning=Witness generators should be transpiled manually using rust-witness CLI");
    println!("cargo:warning=Run: rust-witness <witness_dir> for each circuit");
}

fn check_witness(circuit_name: &str) {
    let witness_dir = format!("../../circuits/{}/build/circuit_js", circuit_name);
    
    if Path::new(&witness_dir).exists() {
        println!("cargo:warning=Found witness for {}", circuit_name);
    } else {
        println!("cargo:warning=Witness WASM not found for {}. Run circuit build first.", circuit_name);
    }
}
