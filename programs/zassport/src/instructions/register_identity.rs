use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::*;

#[derive(Accounts)]
#[instruction(commitment: [u8; 32], nullifier: [u8; 32])]
pub struct RegisterIdentity<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + Identity::INIT_SPACE,
        seeds = [b"identity", user.key().as_ref()],
        bump
    )]
    pub identity: Account<'info, Identity>,

    #[account(
        mut,
        seeds = [b"nullifier_registry"],
        bump = nullifier_registry.bump
    )]
    pub nullifier_registry: Account<'info, NullifierRegistry>,

    #[account(
        init,
        payer = user,
        space = 8 + ReputationRecord::INIT_SPACE,
        seeds = [b"reputation", identity.key().as_ref()],
        bump
    )]
    pub reputation_record: Account<'info, ReputationRecord>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn register_identity(
    ctx: Context<RegisterIdentity>,
    commitment: [u8; 32],
    nullifier: [u8; 32],
) -> Result<()> {
    let identity = &mut ctx.accounts.identity;
    let nullifier_registry = &mut ctx.accounts.nullifier_registry;
    let reputation_record = &mut ctx.accounts.reputation_record;

    // Check if nullifier has been used
    require!(
        !nullifier_registry.nullifiers.contains(&nullifier),
        ZKPassportError::NullifierAlreadyUsed
    );

    // Register the nullifier
    nullifier_registry.nullifiers.push(nullifier);

    // Initialize identity
    identity.owner = ctx.accounts.user.key();
    identity.commitment = commitment;
    identity.nullifier = nullifier;
    identity.reputation_score = 0;
    identity.last_updated = Clock::get()?.unix_timestamp;
    identity.is_active = true;
    identity.bump = ctx.bumps.identity;

    // Initialize reputation record
    reputation_record.identity = identity.key();
    reputation_record.score = 0;
    reputation_record.contributions = 0;
    reputation_record.last_contribution = Clock::get()?.unix_timestamp;
    reputation_record.bump = ctx.bumps.reputation_record;

    msg!("Identity registered successfully with commitment: {:?}", commitment);
    Ok(())
}