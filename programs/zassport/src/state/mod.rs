use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Identity {
    pub owner: Pubkey,              // Solana wallet address
    pub commitment: [u8; 32],       // Hash of passport data + salt
    pub nullifier: [u8; 32],        // Prevents duplicate identities
    pub reputation_score: u64,      // Accumulated reputation
    pub last_updated: i64,          // Timestamp of last update
    pub is_active: bool,            // Whether identity is active
    pub bump: u8,                   // PDA bump
}

#[account]
#[derive(InitSpace)]
pub struct NullifierRegistry {
    #[max_len(100)]                // Start with 100 nullifiers, can be resized later
    pub nullifiers: Vec<[u8; 32]>,  // List of used nullifiers
    pub authority: Pubkey,          // Admin authority
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct ReputationRecord {
    pub identity: Pubkey,           // Reference to identity account
    pub score: u64,                 // Current reputation score
    pub contributions: u64,         // Number of contributions
    pub last_contribution: i64,     // Timestamp of last contribution
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct GovernanceProposal {
    pub id: u64,                    // Proposal ID
    #[max_len(200)]
    pub title: String,              // Proposal title (max 200 chars)
    #[max_len(1000)]
    pub description: String,        // Proposal description (max 1000 chars)
    pub creator: Pubkey,            // Who created the proposal
    pub created_at: i64,            // Creation timestamp
    pub voting_ends: i64,           // Voting end timestamp
    pub yes_votes: u64,             // Number of yes votes
    pub no_votes: u64,              // Number of no votes
    pub executed: bool,             // Whether proposal was executed
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct VoteRecord {
    pub proposal: u64,              // Proposal ID
    pub voter_identity: Pubkey,     // Identity account of voter
    pub vote: u8,                   // 0 = No, 1 = Yes
    pub voted_at: i64,              // Timestamp of vote
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Debug)]
pub enum VoteType {
    Yes,
    No,
}