use anchor_lang::prelude::*;

#[error_code]
pub enum ZKPassportError {
    #[msg("Nullifier has already been used - identity already registered")]
    NullifierAlreadyUsed,

    #[msg("Unauthorized access")]
    Unauthorized,

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

    #[msg("Passport verification failed")]
    PassportVerificationFailed,
}