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
    
    #[msg("Invalid signature count")]
    InvalidSignatureCount,
    
    #[msg("Insufficient signatures for quorum")]
    InsufficientSignatures,
    
    #[msg("Insufficient valid signatures")]
    InsufficientValidSignatures,
    
    #[msg("Invalid guardian count")]
    InvalidGuardianCount,
    
    #[msg("Invalid threshold value")]
    InvalidThreshold,
    
    #[msg("Insufficient guardian signatures")]
    InsufficientGuardianSignatures,

    #[msg("Missing ed25519 signature instruction")] 
    MissingEd25519Instruction,

    #[msg("Invalid attestation message")] 
    InvalidAttestationMessage,

    #[msg("Invalid verifier public key")] 
    InvalidVerifier,

    #[msg("Attestation expired or not yet valid")] 
    AttestationTimestampInvalid,
}

#[error_code]
pub enum ZassportError {
    // Multi-Verifier Errors
    #[msg("Invalid threshold value")]
    InvalidThreshold,
    
    #[msg("Not enough verifiers for the threshold")]
    NotEnoughVerifiers,
    
    #[msg("Too many verifiers (max 10)")]
    TooManyVerifiers,
    
    #[msg("Verifier already exists")]
    VerifierAlreadyExists,
    
    #[msg("Verifier not found")]
    VerifierNotFound,
    
    #[msg("Unauthorized verifier")]
    UnauthorizedVerifier,
    
    // Revocation Errors
    #[msg("Credential already revoked")]
    AlreadyRevoked,
    
    #[msg("Credential not revoked")]
    NotRevoked,
    
    // Social Recovery Errors
    #[msg("Not enough guardians for the threshold")]
    NotEnoughGuardians,
    
    #[msg("Too many guardians (max 7)")]
    TooManyGuardians,
    
    #[msg("Guardian already exists")]
    GuardianAlreadyExists,
    
    #[msg("Guardian not found")]
    GuardianNotFound,
    
    #[msg("Not a guardian")]
    NotAGuardian,
    
    #[msg("Recovery delay too short (min 24 hours)")]
    RecoveryDelayTooShort,
    
    #[msg("Recovery already in progress")]
    RecoveryInProgress,
    
    #[msg("No recovery pending")]
    NoRecoveryPending,
    
    #[msg("Recovery delay not met")]
    RecoveryDelayNotMet,
    
    // General Errors
    #[msg("Unauthorized access")]
    UnauthorizedAccess,
    
    #[msg("Operation not allowed")]
    NotAllowed,
}
