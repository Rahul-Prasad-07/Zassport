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

    // ==================== MULTI-VERIFIER QUORUM ====================
    
    /// Initialize multi-verifier configuration with threshold
    pub fn initialize_multi_verifier(
        ctx: Context<InitializeMultiVerifier>,
        threshold: u8,
        verifiers: Vec<Pubkey>,
    ) -> Result<()> {
        instructions::multi_verifier::initialize_multi_verifier(ctx, threshold, verifiers)
    }
    
    /// Add a verifier to the multi-verifier set
    pub fn add_verifier(
        ctx: Context<ModifyVerifier>,
        new_verifier: Pubkey,
    ) -> Result<()> {
        instructions::multi_verifier::add_verifier(ctx, new_verifier)
    }
    
    /// Remove a verifier from the multi-verifier set
    pub fn remove_verifier(
        ctx: Context<ModifyVerifier>,
        verifier_to_remove: Pubkey,
    ) -> Result<()> {
        instructions::multi_verifier::remove_verifier(ctx, verifier_to_remove)
    }
    
    /// Update quorum threshold
    pub fn update_threshold(
        ctx: Context<ModifyVerifier>,
        new_threshold: u8,
    ) -> Result<()> {
        instructions::multi_verifier::update_threshold(ctx, new_threshold)
    }
    
    /// Submit attestation as a verifier (contributes to quorum)
    pub fn submit_attestation(
        ctx: Context<SubmitAttestation>,
        attestation_type: u8,
        attested_value: u64,
        expiry: i64,
        signature: [u8; 64],
    ) -> Result<()> {
        instructions::multi_verifier::submit_attestation(ctx, attestation_type, attested_value, expiry, signature)
    }
    
    /// Initialize quorum status for an identity
    pub fn initialize_quorum_status(
        ctx: Context<InitializeQuorumStatus>,
    ) -> Result<()> {
        instructions::multi_verifier::initialize_quorum_status(ctx)
    }

    // ==================== REVOCATION SYSTEM ====================
    
    /// Initialize revocation registry
    pub fn initialize_revocation_registry(
        ctx: Context<InitializeRevocationRegistry>,
    ) -> Result<()> {
        instructions::revocation::initialize_revocation_registry(ctx)
    }
    
    /// Revoke a credential (admin)
    pub fn revoke_credential(
        ctx: Context<RevokeCredential>,
        reason: u8,
        new_merkle_root: [u8; 32],
        merkle_proof: [u8; 32],
    ) -> Result<()> {
        instructions::revocation::revoke_credential(ctx, reason, new_merkle_root, merkle_proof)
    }
    
    /// Update Merkle root for batch revocations
    pub fn update_merkle_root(
        ctx: Context<UpdateMerkleRoot>,
        new_root: [u8; 32],
    ) -> Result<()> {
        instructions::revocation::update_merkle_root(ctx, new_root)
    }
    
    /// Self-revoke (user revokes own credential)
    pub fn self_revoke(
        ctx: Context<SelfRevoke>,
        reason: u8,
    ) -> Result<()> {
        instructions::revocation::self_revoke(ctx, reason)
    }

    // ==================== SOCIAL RECOVERY ====================
    
    /// Initialize social recovery with guardians
    pub fn initialize_social_recovery(
        ctx: Context<InitializeSocialRecovery>,
        threshold: u8,
        guardians: Vec<Pubkey>,
        recovery_delay: i64,
    ) -> Result<()> {
        instructions::social_recovery::initialize_social_recovery(ctx, threshold, guardians, recovery_delay)
    }
    
    /// Add a guardian
    pub fn add_guardian(
        ctx: Context<ModifyGuardian>,
        new_guardian: Pubkey,
    ) -> Result<()> {
        instructions::social_recovery::add_guardian(ctx, new_guardian)
    }
    
    /// Remove a guardian
    pub fn remove_guardian(
        ctx: Context<ModifyGuardian>,
        guardian_to_remove: Pubkey,
    ) -> Result<()> {
        instructions::social_recovery::remove_guardian(ctx, guardian_to_remove)
    }
    
    /// Guardian approves recovery
    pub fn approve_recovery(
        ctx: Context<ApproveRecovery>,
        new_owner: Pubkey,
    ) -> Result<()> {
        instructions::social_recovery::approve_recovery(ctx, new_owner)
    }
    
    /// Initiate recovery process
    pub fn initiate_recovery(
        ctx: Context<InitiateRecovery>,
        new_owner: Pubkey,
    ) -> Result<()> {
        instructions::social_recovery::initiate_recovery(ctx, new_owner)
    }
    
    /// Execute recovery after delay
    pub fn execute_recovery(
        ctx: Context<ExecuteRecovery>,
    ) -> Result<()> {
        instructions::social_recovery::execute_recovery(ctx)
    }
    
    /// Cancel pending recovery
    pub fn cancel_recovery(
        ctx: Context<CancelRecovery>,
    ) -> Result<()> {
        instructions::social_recovery::cancel_recovery(ctx)
    }
}
