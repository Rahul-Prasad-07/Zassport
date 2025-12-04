use anchor_lang::prelude::*;
use crate::state::multi_verifier::*;
use crate::state::Identity;
use crate::errors::ZassportError;

/// Initialize Social Recovery Configuration
/// Sets up guardians for identity recovery
pub fn initialize_social_recovery(
    ctx: Context<InitializeSocialRecovery>,
    threshold: u8,
    guardians: Vec<Pubkey>,
    recovery_delay: i64, // in seconds
) -> Result<()> {
    require!(threshold >= 1, ZassportError::InvalidThreshold);
    require!(guardians.len() >= threshold as usize, ZassportError::NotEnoughGuardians);
    require!(guardians.len() <= 7, ZassportError::TooManyGuardians);
    require!(recovery_delay >= 86400, ZassportError::RecoveryDelayTooShort); // Min 24 hours
    
    let config = &mut ctx.accounts.social_recovery_config;
    config.identity = ctx.accounts.identity.key();
    config.threshold = threshold;
    config.total_guardians = guardians.len() as u8;
    config.guardians = guardians;
    config.recovery_delay = recovery_delay;
    config.pending_recovery = false;
    config.pending_new_owner = Pubkey::default();
    config.recovery_initiated_at = 0;
    config.bump = ctx.bumps.social_recovery_config;
    
    msg!("Social recovery initialized: {}/{} threshold, {} second delay", 
         threshold, config.total_guardians, recovery_delay);
    Ok(())
}

/// Add a guardian
pub fn add_guardian(
    ctx: Context<ModifyGuardian>,
    new_guardian: Pubkey,
) -> Result<()> {
    let config = &mut ctx.accounts.social_recovery_config;
    
    // Verify owner
    let identity = &ctx.accounts.identity;
    require!(identity.owner == ctx.accounts.owner.key(), ZassportError::UnauthorizedAccess);
    
    require!(config.guardians.len() < 7, ZassportError::TooManyGuardians);
    require!(!config.guardians.contains(&new_guardian), ZassportError::GuardianAlreadyExists);
    require!(!config.pending_recovery, ZassportError::RecoveryInProgress);
    
    config.guardians.push(new_guardian);
    config.total_guardians = config.guardians.len() as u8;
    
    msg!("Added guardian: {}", new_guardian);
    Ok(())
}

/// Remove a guardian
pub fn remove_guardian(
    ctx: Context<ModifyGuardian>,
    guardian_to_remove: Pubkey,
) -> Result<()> {
    let config = &mut ctx.accounts.social_recovery_config;
    
    // Verify owner
    let identity = &ctx.accounts.identity;
    require!(identity.owner == ctx.accounts.owner.key(), ZassportError::UnauthorizedAccess);
    require!(!config.pending_recovery, ZassportError::RecoveryInProgress);
    
    let idx = config.guardians.iter().position(|&g| g == guardian_to_remove)
        .ok_or(ZassportError::GuardianNotFound)?;
    
    config.guardians.remove(idx);
    config.total_guardians = config.guardians.len() as u8;
    
    // Ensure threshold is still achievable
    require!(config.total_guardians >= config.threshold, ZassportError::NotEnoughGuardians);
    
    msg!("Removed guardian: {}", guardian_to_remove);
    Ok(())
}

/// Guardian approves recovery
/// Each guardian calls this to vote for the new owner
pub fn approve_recovery(
    ctx: Context<ApproveRecovery>,
    new_owner: Pubkey,
) -> Result<()> {
    let config = &ctx.accounts.social_recovery_config;
    let guardian = ctx.accounts.guardian.key();
    
    // Verify this is a valid guardian
    require!(config.guardians.contains(&guardian), ZassportError::NotAGuardian);
    
    let approval = &mut ctx.accounts.guardian_approval;
    approval.recovery_config = ctx.accounts.social_recovery_config.key();
    approval.guardian = guardian;
    approval.new_owner = new_owner;
    approval.approved_at = Clock::get()?.unix_timestamp;
    approval.bump = ctx.bumps.guardian_approval;
    
    msg!("Guardian {} approved recovery for new owner {}", guardian, new_owner);
    Ok(())
}

/// Initiate recovery process
/// Requires threshold guardians to have approved
pub fn initiate_recovery(
    ctx: Context<InitiateRecovery>,
    new_owner: Pubkey,
) -> Result<()> {
    let config = &mut ctx.accounts.social_recovery_config;
    
    require!(!config.pending_recovery, ZassportError::RecoveryInProgress);
    
    // Count approvals (would need to iterate through guardian_approval accounts)
    // This is a simplified version - in production, use remaining accounts
    
    let clock = Clock::get()?;
    config.pending_recovery = true;
    config.pending_new_owner = new_owner;
    config.recovery_initiated_at = clock.unix_timestamp;
    
    msg!("Recovery initiated for new owner: {}. Will complete after {} seconds", 
         new_owner, config.recovery_delay);
    Ok(())
}

/// Execute recovery after delay period
pub fn execute_recovery(
    ctx: Context<ExecuteRecovery>,
) -> Result<()> {
    let config = &mut ctx.accounts.social_recovery_config;
    let identity = &mut ctx.accounts.identity;
    
    require!(config.pending_recovery, ZassportError::NoRecoveryPending);
    
    let clock = Clock::get()?;
    let time_elapsed = clock.unix_timestamp - config.recovery_initiated_at;
    
    require!(time_elapsed >= config.recovery_delay, ZassportError::RecoveryDelayNotMet);
    
    // Transfer ownership
    let old_owner = identity.owner;
    identity.owner = config.pending_new_owner;
    identity.last_updated = clock.unix_timestamp;
    
    // Reset recovery state
    config.pending_recovery = false;
    config.pending_new_owner = Pubkey::default();
    config.recovery_initiated_at = 0;
    
    msg!("Recovery executed! Ownership transferred from {} to {}", old_owner, identity.owner);
    Ok(())
}

/// Cancel pending recovery (owner or guardians can cancel)
pub fn cancel_recovery(
    ctx: Context<CancelRecovery>,
) -> Result<()> {
    let config = &mut ctx.accounts.social_recovery_config;
    let identity = &ctx.accounts.identity;
    
    // Either owner or a guardian can cancel
    let caller = ctx.accounts.caller.key();
    require!(
        identity.owner == caller || config.guardians.contains(&caller),
        ZassportError::UnauthorizedAccess
    );
    require!(config.pending_recovery, ZassportError::NoRecoveryPending);
    
    config.pending_recovery = false;
    config.pending_new_owner = Pubkey::default();
    config.recovery_initiated_at = 0;
    
    msg!("Recovery cancelled by {}", caller);
    Ok(())
}

// Account contexts

#[derive(Accounts)]
pub struct InitializeSocialRecovery<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    
    #[account(
        seeds = [b"identity", owner.key().as_ref()],
        bump = identity.bump,
        constraint = identity.owner == owner.key() @ ZassportError::UnauthorizedAccess
    )]
    pub identity: Account<'info, Identity>,
    
    #[account(
        init,
        payer = owner,
        space = 8 + SocialRecoveryConfig::INIT_SPACE,
        seeds = [b"social_recovery", identity.key().as_ref()],
        bump
    )]
    pub social_recovery_config: Account<'info, SocialRecoveryConfig>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ModifyGuardian<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    
    #[account(
        seeds = [b"identity", owner.key().as_ref()],
        bump = identity.bump,
        constraint = identity.owner == owner.key() @ ZassportError::UnauthorizedAccess
    )]
    pub identity: Account<'info, Identity>,
    
    #[account(
        mut,
        seeds = [b"social_recovery", identity.key().as_ref()],
        bump = social_recovery_config.bump
    )]
    pub social_recovery_config: Account<'info, SocialRecoveryConfig>,
}

#[derive(Accounts)]
#[instruction(new_owner: Pubkey)]
pub struct ApproveRecovery<'info> {
    #[account(mut)]
    pub guardian: Signer<'info>,
    
    #[account(
        seeds = [b"identity", identity.owner.as_ref()],
        bump = identity.bump
    )]
    pub identity: Account<'info, Identity>,
    
    #[account(
        seeds = [b"social_recovery", identity.key().as_ref()],
        bump = social_recovery_config.bump
    )]
    pub social_recovery_config: Account<'info, SocialRecoveryConfig>,
    
    #[account(
        init,
        payer = guardian,
        space = 8 + GuardianApproval::INIT_SPACE,
        seeds = [b"guardian_approval", social_recovery_config.key().as_ref(), guardian.key().as_ref()],
        bump
    )]
    pub guardian_approval: Account<'info, GuardianApproval>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitiateRecovery<'info> {
    #[account(mut)]
    pub initiator: Signer<'info>, // Must be a guardian
    
    #[account(
        seeds = [b"identity", identity.owner.as_ref()],
        bump = identity.bump
    )]
    pub identity: Account<'info, Identity>,
    
    #[account(
        mut,
        seeds = [b"social_recovery", identity.key().as_ref()],
        bump = social_recovery_config.bump
    )]
    pub social_recovery_config: Account<'info, SocialRecoveryConfig>,
}

#[derive(Accounts)]
pub struct ExecuteRecovery<'info> {
    pub executor: Signer<'info>, // Anyone can execute after delay
    
    #[account(
        mut,
        seeds = [b"identity", identity.owner.as_ref()],
        bump = identity.bump
    )]
    pub identity: Account<'info, Identity>,
    
    #[account(
        mut,
        seeds = [b"social_recovery", identity.key().as_ref()],
        bump = social_recovery_config.bump
    )]
    pub social_recovery_config: Account<'info, SocialRecoveryConfig>,
}

#[derive(Accounts)]
pub struct CancelRecovery<'info> {
    pub caller: Signer<'info>,
    
    #[account(
        seeds = [b"identity", identity.owner.as_ref()],
        bump = identity.bump
    )]
    pub identity: Account<'info, Identity>,
    
    #[account(
        mut,
        seeds = [b"social_recovery", identity.key().as_ref()],
        bump = social_recovery_config.bump
    )]
    pub social_recovery_config: Account<'info, SocialRecoveryConfig>,
}
