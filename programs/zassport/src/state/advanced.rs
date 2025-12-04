use anchor_lang::prelude::*;

#[account]
pub struct MultiSigAttestation {
    pub claim_hash: [u8; 32],
    pub signatures: Vec<[u8; 64]>,
    pub verifiers: Vec<Pubkey>,
    pub threshold: u8,
    pub created_at: i64,
    pub bump: u8,
}

impl MultiSigAttestation {
    pub const LEN: usize = 8 + 32 + (4 + 64 * 5) + (4 + 32 * 5) + 1 + 8 + 1;
}

#[account]
pub struct VerifierRegistry {
    pub authority: Pubkey,
    pub verifiers: Vec<Pubkey>,
    pub stakes: Vec<u64>,
    pub reputations: Vec<u64>,
    pub threshold: u8,
    pub bump: u8,
}

impl VerifierRegistry {
    pub const LEN: usize = 8 + 32 + (4 + 32 * 10) + (4 + 8 * 10) + (4 + 8 * 10) + 1 + 1;
}

#[account]
pub struct SanctionsRegistry {
    pub authority: Pubkey,
    pub merkle_root: [u8; 32],
    pub last_updated: i64,
    pub leaf_count: u32,
    pub bump: u8,
}

impl SanctionsRegistry {
    pub const LEN: usize = 8 + 32 + 32 + 8 + 4 + 1;
}

#[account]
pub struct RevocationRegistry {
    pub authority: Pubkey,
    pub merkle_root: [u8; 32],
    pub last_updated: i64,
    pub revoked_count: u32,
    pub bump: u8,
}

impl RevocationRegistry {
    pub const LEN: usize = 8 + 32 + 32 + 8 + 4 + 1;
}

#[account]
pub struct Guardian {
    pub identity: Pubkey,
    pub guardian_pubkeys: Vec<Pubkey>,
    pub threshold: u8,
    pub bump: u8,
}

impl Guardian {
    pub const LEN: usize = 8 + 32 + (4 + 32 * 5) + 1 + 1;
}
