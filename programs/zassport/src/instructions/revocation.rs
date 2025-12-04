use anchor_lang::prelude::*;
use crate::state::multi_verifier::*;
use crate::state::Identity;
use crate::errors::ZassportError;

/// Initialize Revocation Registry
/// Creates the on-chain registry for tracking revoked credentials
pub fn initialize_revocation_registry(
    ctx: Context<InitializeRevocationRegistry>,
) -> Result<()> {
    let registry = &mut ctx.accounts.revocation_registry;
    registry.authority = ctx.accounts.authority.key();
    registry.merkle_root = [0u8; 32]; // Empty root initially
    registry.total_revocations = 0;
    registry.last_updated = Clock::get()?.unix_timestamp;
    registry.bump = ctx.bumps.revocation_registry;
    
    msg!("Revocation registry initialized");
    Ok(())
}

/// Revoke a credential
/// Adds an identity to the revocation registry
pub fn revoke_credential(
    ctx: Context<RevokeCredential>,
    reason: u8,
    new_merkle_root: [u8; 32],
    merkle_proof: [u8; 32],
) -> Result<()> {
    let registry = &mut ctx.accounts.revocation_registry;
    let entry = &mut ctx.accounts.revocation_entry;
    
    let clock = Clock::get()?;
    let now = clock.unix_timestamp;
    
    // Store revocation entry
    entry.identity = ctx.accounts.identity.key();
    entry.revoked_by = ctx.accounts.authority.key();
    entry.reason = reason;
    entry.revoked_at = now;
    entry.merkle_proof = merkle_proof;
    entry.bump = ctx.bumps.revocation_entry;
    
    // Update registry
    registry.merkle_root = new_merkle_root;
    registry.total_revocations += 1;
    registry.last_updated = now;
    
    // Deactivate the identity
    let identity = &mut ctx.accounts.identity;
    identity.is_active = false;
    
    let reason_str = match RevocationReason::from(reason) {
        RevocationReason::Lost => "Lost",
        RevocationReason::Stolen => "Stolen",
        RevocationReason::Expired => "Expired",
        RevocationReason::Compromised => "Compromised",
        RevocationReason::AdminAction => "Admin Action",
    };
    
    msg!("Credential revoked. Reason: {}", reason_str);
    Ok(())
}

/// Check if a credential is revoked
pub fn check_revocation(
    ctx: Context<CheckRevocation>,
) -> Result<bool> {
    // If entry exists, the credential is revoked
    let is_revoked = ctx.accounts.revocation_entry.identity != Pubkey::default();
    
    msg!("Revocation check: {}", is_revoked);
    Ok(is_revoked)
}

/// Update the Merkle root (batch revocation update)
pub fn update_merkle_root(
    ctx: Context<UpdateMerkleRoot>,
    new_root: [u8; 32],
) -> Result<()> {
    let registry = &mut ctx.accounts.revocation_registry;
    
    registry.merkle_root = new_root;
    registry.last_updated = Clock::get()?.unix_timestamp;
    
    msg!("Merkle root updated");
    Ok(())
}

/// Self-revoke (user revokes their own credential)
pub fn self_revoke(
    ctx: Context<SelfRevoke>,
    reason: u8,
) -> Result<()> {
    let entry = &mut ctx.accounts.revocation_entry;
    let identity = &mut ctx.accounts.identity;
    
    let clock = Clock::get()?;
    let now = clock.unix_timestamp;
    
    // Verify owner
    require!(identity.owner == ctx.accounts.owner.key(), ZassportError::UnauthorizedAccess);
    
    // Store revocation entry
    entry.identity = identity.key();
    entry.revoked_by = ctx.accounts.owner.key();
    entry.reason = reason;
    entry.revoked_at = now;
    entry.merkle_proof = [0u8; 32]; // Self-revocations don't need proof
    entry.bump = ctx.bumps.revocation_entry;
    
    // Deactivate
    identity.is_active = false;
    
    msg!("Self-revocation completed");
    Ok(())
}

// Account contexts

#[derive(Accounts)]
pub struct InitializeRevocationRegistry<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        init,
        payer = authority,
        space = 8 + RevocationRegistry::INIT_SPACE,
        seeds = [b"revocation_registry"],
        bump
    )]
    pub revocation_registry: Account<'info, RevocationRegistry>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RevokeCredential<'info> {
    #[account(
        mut,
        constraint = authority.key() == revocation_registry.authority @ ZassportError::UnauthorizedAccess
    )]
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"revocation_registry"],
        bump = revocation_registry.bump
    )]
    pub revocation_registry: Account<'info, RevocationRegistry>,
    
    #[account(
        mut,
        seeds = [b"identity", identity.owner.as_ref()],
        bump = identity.bump
    )]
    pub identity: Account<'info, Identity>,
    
    #[account(
        init,
        payer = authority,
        space = 8 + RevocationEntry::INIT_SPACE,
        seeds = [b"revocation", identity.key().as_ref()],
        bump
    )]
    pub revocation_entry: Account<'info, RevocationEntry>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CheckRevocation<'info> {
    /// CHECK: May not exist, we just check
    #[account(
        seeds = [b"revocation", identity.key().as_ref()],
        bump
    )]
    pub revocation_entry: Account<'info, RevocationEntry>,
    
    #[account(
        seeds = [b"identity", identity.owner.as_ref()],
        bump = identity.bump
    )]
    pub identity: Account<'info, Identity>,
}

#[derive(Accounts)]
pub struct UpdateMerkleRoot<'info> {
    #[account(
        constraint = authority.key() == revocation_registry.authority @ ZassportError::UnauthorizedAccess
    )]
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"revocation_registry"],
        bump = revocation_registry.bump
    )]
    pub revocation_registry: Account<'info, RevocationRegistry>,
}

#[derive(Accounts)]
pub struct SelfRevoke<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"identity", owner.key().as_ref()],
        bump = identity.bump,
        constraint = identity.owner == owner.key() @ ZassportError::UnauthorizedAccess
    )]
    pub identity: Account<'info, Identity>,
    
    #[account(
        init,
        payer = owner,
        space = 8 + RevocationEntry::INIT_SPACE,
        seeds = [b"revocation", identity.key().as_ref()],
        bump
    )]
    pub revocation_entry: Account<'info, RevocationEntry>,
    
    pub system_program: Program<'info, System>,
}
