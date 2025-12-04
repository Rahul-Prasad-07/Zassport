use anchor_lang::prelude::*;

/// Multi-Verifier Quorum Configuration
/// Manages a set of trusted verifiers for decentralized attestation
#[account]
#[derive(InitSpace)]
pub struct MultiVerifierConfig {
    pub authority: Pubkey,           // Admin who can add/remove verifiers
    pub threshold: u8,               // Minimum number of attestations required (e.g., 3)
    pub total_verifiers: u8,         // Total verifiers in the set (e.g., 5)
    #[max_len(10)]
    pub verifiers: Vec<Pubkey>,      // List of authorized verifier public keys
    pub created_at: i64,             // Creation timestamp
    pub bump: u8,
}

/// Individual Attestation from a Verifier
/// Each verifier submits their attestation separately
#[account]
#[derive(InitSpace)]
pub struct VerifierAttestation {
    pub identity: Pubkey,            // Identity being attested
    pub verifier: Pubkey,            // Which verifier attested
    pub attestation_type: u8,        // 0=Age, 1=Nationality, 2=Validity, 3=Sanctions
    pub attested_value: u64,         // The attested value (age threshold, nationality code, etc.)
    pub timestamp: i64,              // When the attestation was made
    pub expiry: i64,                 // When the attestation expires
    pub signature: [u8; 64],         // Ed25519 signature from verifier
    pub bump: u8,
}

/// Quorum Status for an Identity
/// Tracks which attestations have reached quorum
#[account]
#[derive(InitSpace)]
pub struct QuorumStatus {
    pub identity: Pubkey,            // Identity account
    // Age attestation
    pub age_attestation_count: u8,   // Number of verifiers who attested age
    pub age_threshold_met: bool,     // Whether quorum threshold is met
    pub age_value: u64,              // Attested minimum age
    // Nationality attestation
    pub nationality_attestation_count: u8,
    pub nationality_threshold_met: bool,
    pub nationality_value: u64,      // Attested nationality code
    // Validity attestation
    pub validity_attestation_count: u8,
    pub validity_threshold_met: bool,
    pub validity_expiry: i64,        // Document expiry date
    // Sanctions attestation
    pub sanctions_attestation_count: u8,
    pub sanctions_threshold_met: bool,
    pub sanctions_clear: bool,       // True if not on sanctions list
    // Metadata
    pub last_updated: i64,
    pub bump: u8,
}

/// Revocation Entry
/// Used for credential revocation
#[account]
#[derive(InitSpace)]
pub struct RevocationEntry {
    pub identity: Pubkey,            // Revoked identity
    pub revoked_by: Pubkey,          // Authority who revoked
    pub reason: u8,                  // 0=Lost, 1=Stolen, 2=Expired, 3=Compromised, 4=AdminAction
    pub revoked_at: i64,             // Revocation timestamp
    pub merkle_proof: [u8; 32],      // Proof of inclusion in revocation tree
    pub bump: u8,
}

/// Revocation Registry
/// On-chain Merkle root for efficient revocation checks
#[account]
#[derive(InitSpace)]
pub struct RevocationRegistry {
    pub authority: Pubkey,           // Who can add revocations
    pub merkle_root: [u8; 32],       // Current root of revocation Merkle tree
    pub total_revocations: u64,      // Total number of revocations
    pub last_updated: i64,           // Last update timestamp
    pub bump: u8,
}

/// Social Recovery Configuration
/// Manages guardians for identity recovery
#[account]
#[derive(InitSpace)]
pub struct SocialRecoveryConfig {
    pub identity: Pubkey,            // Identity this config belongs to
    pub threshold: u8,               // Number of guardians needed to recover (e.g., 3)
    pub total_guardians: u8,         // Total guardians (e.g., 5)
    #[max_len(7)]
    pub guardians: Vec<Pubkey>,      // Guardian public keys
    pub recovery_delay: i64,         // Delay in seconds before recovery completes
    pub pending_recovery: bool,      // Whether recovery is in progress
    pub pending_new_owner: Pubkey,   // New owner if recovery is pending
    pub recovery_initiated_at: i64,  // When recovery was initiated
    pub bump: u8,
}

/// Guardian Approval
/// Individual guardian approvals for recovery
#[account]
#[derive(InitSpace)]
pub struct GuardianApproval {
    pub recovery_config: Pubkey,     // Recovery config this approval is for
    pub guardian: Pubkey,            // Guardian who approved
    pub new_owner: Pubkey,           // New owner being approved
    pub approved_at: i64,            // When approval was given
    pub bump: u8,
}

/// Cross-Chain Attestation
/// Stores attestations bridged from other chains
#[account]
#[derive(InitSpace)]
pub struct CrossChainAttestation {
    pub identity: Pubkey,            // Identity on Solana
    pub source_chain: u16,           // Wormhole chain ID (1=Solana, 2=Ethereum, etc.)
    pub source_address: [u8; 32],    // Address on source chain
    pub attestation_type: u8,        // Type of attestation
    pub attested_value: u64,         // Value being attested
    pub vaa_hash: [u8; 32],          // Wormhole VAA hash for verification
    pub timestamp: i64,              // When bridged
    pub bump: u8,
}

/// Attestation Type enum (stored as u8)
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Debug)]
pub enum AttestationType {
    Age = 0,
    Nationality = 1,
    Validity = 2,
    Sanctions = 3,
}

impl From<u8> for AttestationType {
    fn from(value: u8) -> Self {
        match value {
            0 => AttestationType::Age,
            1 => AttestationType::Nationality,
            2 => AttestationType::Validity,
            3 => AttestationType::Sanctions,
            _ => AttestationType::Age, // Default
        }
    }
}

/// Revocation Reason enum (stored as u8)
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Debug)]
pub enum RevocationReason {
    Lost = 0,
    Stolen = 1,
    Expired = 2,
    Compromised = 3,
    AdminAction = 4,
}

impl From<u8> for RevocationReason {
    fn from(value: u8) -> Self {
        match value {
            0 => RevocationReason::Lost,
            1 => RevocationReason::Stolen,
            2 => RevocationReason::Expired,
            3 => RevocationReason::Compromised,
            4 => RevocationReason::AdminAction,
            _ => RevocationReason::AdminAction, // Default
        }
    }
}

/// Wormhole Chain IDs
pub const CHAIN_ID_SOLANA: u16 = 1;
pub const CHAIN_ID_ETHEREUM: u16 = 2;
pub const CHAIN_ID_BSC: u16 = 4;
pub const CHAIN_ID_POLYGON: u16 = 5;
pub const CHAIN_ID_AVALANCHE: u16 = 6;
pub const CHAIN_ID_ARBITRUM: u16 = 23;
pub const CHAIN_ID_OPTIMISM: u16 = 24;
