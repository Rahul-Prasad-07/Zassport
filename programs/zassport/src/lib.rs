use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod state;
pub mod zk_verifier;

use errors::*;
use instructions::*;
use state::*;

declare_id!("FR6XtcALdJfPRTLzSyhjt5fJ1eoYsEn8kq4vcGAkd8WQ");

#[program]
pub mod zassport {
    use super::*;

    // Initialize the program
    pub fn initialize_program(ctx: Context<InitializeProgram>) -> Result<()> {
        instructions::initialize::initialize_program(ctx)
    }

    // Verify passport ZK proof and register identity
    pub fn verify_passport_proof(
        ctx: Context<VerifyPassportProof>,
        commitment: [u8; 32],
        nullifier: [u8; 32],
        proof: Vec<u8>,
    ) -> Result<()> {
        instructions::verify_proof::verify_passport_proof(ctx, commitment, nullifier, proof)
    }

    // Register identity with commitment and nullifier
    pub fn register_identity(
        ctx: Context<RegisterIdentity>,
        commitment: [u8; 32],
        nullifier: [u8; 32],
    ) -> Result<()> {
        instructions::register_identity::register_identity(ctx, commitment, nullifier)
    }

    // Update reputation score
    pub fn update_reputation(ctx: Context<UpdateReputation>, points: i64) -> Result<()> {
        instructions::update_reputation::update_reputation(ctx, points)
    }

    // Create governance proposal
    pub fn create_proposal(
        ctx: Context<CreateProposal>,
        proposal_id: u64,
        title: String,
        description: String,
        voting_period: i64,
    ) -> Result<()> {
        instructions::create_proposal::create_proposal(
            ctx,
            proposal_id,
            title,
            description,
            voting_period,
        )
    }

    // Cast vote on proposal
    pub fn cast_vote(ctx: Context<CastVote>, proposal_id: u64, vote: VoteType) -> Result<()> {
        instructions::cast_vote::cast_vote(ctx, proposal_id, vote)
    }

    // Verify age proof
    pub fn verify_age_proof(
        ctx: Context<VerifyAgeProof>,
        commitment: [u8; 32],
        nullifier: [u8; 32],
        current_timestamp: i64,
        min_age: u64,
        max_age: u64,
        proof: Vec<u8>,
    ) -> Result<()> {
        instructions::verify_age_proof::verify_age_proof(
            ctx,
            commitment,
            nullifier,
            current_timestamp,
            min_age,
            max_age,
            proof,
        )
    }

    // Verify nationality proof
    pub fn verify_nationality_proof(
        ctx: Context<VerifyNationalityProof>,
        commitment: [u8; 32],
        nullifier: [u8; 32],
        allowed_nationality: u64,
        proof: Vec<u8>,
    ) -> Result<()> {
        instructions::verify_nationality_proof::verify_nationality_proof(
            ctx,
            commitment,
            nullifier,
            allowed_nationality,
            proof,
        )
    }

    // Initialize verifier configuration (trusted off-chain signer)
    pub fn initialize_verifier_config(
        ctx: Context<InitializeVerifierConfig>,
        verifier: Pubkey,
    ) -> Result<()> {
        instructions::set_verifier::initialize_verifier_config(ctx, verifier)
    }

    // Update verifier public key (authority only)
    pub fn update_verifier(ctx: Context<UpdateVerifier>, new_verifier: Pubkey) -> Result<()> {
        instructions::set_verifier::update_verifier(ctx, new_verifier)
    }

    // Off-chain attestation: Age
    pub fn attest_age(
        ctx: Context<AttestAge>,
        min_age: u64,
        timestamp: i64,
    ) -> Result<()> {
        instructions::attest_age_proof::attest_age(ctx, min_age, timestamp)
    }

    // Off-chain attestation: Nationality
    pub fn attest_nationality(
        ctx: Context<AttestNationality>,
        allowed_nationality: u64,
        timestamp: i64,
    ) -> Result<()> {
        instructions::attest_nationality_proof::attest_nationality(
            ctx,
            allowed_nationality,
            timestamp,
        )
    }
}
