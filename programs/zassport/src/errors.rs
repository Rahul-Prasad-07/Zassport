use anchor_lang::prelude::*;

#[error_code]
pub enum ZKPassportError {
    #[msg("Nullifier has already been used - identity already registered")]
    NullifierAlreadyUsed,

    #[msg("Unauthorized access")]
    Unauthorized,

    #[msg("Unauthorized access to identity")]
    UnauthorizedAccess,

    #[msg("Identity is not active")]
    IdentityNotActive,

    #[msg("Proposal title is too long (max 200 characters)")]
    TitleTooLong,

    #[msg("Proposal description is too long (max 1000 characters)")]
    DescriptionTooLong,

    #[msg("Invalid voting period")]
    InvalidVotingPeriod,

    #[msg("Proposal has already been executed")]
    ProposalAlreadyExecuted,

    #[msg("Voting period has ended")]
    VotingPeriodEnded,

    #[msg("Invalid ZK proof")]
    InvalidZKProof,

    #[msg("Invalid proof data")]
    InvalidProof,

    #[msg("Invalid commitment")]
    InvalidCommitment,

    #[msg("Invalid nullifier")]
    InvalidNullifier,

    #[msg("Passport verification failed")]
    PassportVerificationFailed,

    #[msg("Invalid verification key")]
    InvalidVerificationKey,

    #[msg("Proof verification failed")]
    ProofVerificationFailed,

    #[msg("Missing ed25519 signature instruction")] 
    MissingEd25519Instruction,

    #[msg("Invalid attestation message")] 
    InvalidAttestationMessage,

    #[msg("Invalid verifier public key")] 
    InvalidVerifier,

    #[msg("Attestation expired or not yet valid")] 
    AttestationTimestampInvalid,
}
