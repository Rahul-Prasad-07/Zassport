use crate::errors::*;
use crate::state::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct UpdateReputation<'info> {
    #[account(
        mut,
        seeds = [b"identity", authority.key().as_ref()],
        bump = identity.bump
    )]
    pub identity: Account<'info, Identity>,

    #[account(
        mut,
        seeds = [b"reputation", identity.key().as_ref()],
        bump = reputation_record.bump
    )]
    pub reputation_record: Account<'info, ReputationRecord>,

    pub authority: Signer<'info>, // Admin or authorized entity
}

pub fn update_reputation(ctx: Context<UpdateReputation>, points: i64) -> Result<()> {
    let identity = &mut ctx.accounts.identity;
    let reputation_record = &mut ctx.accounts.reputation_record;

    // Update reputation score (can be positive or negative)
    if points > 0 {
        identity.reputation_score = identity.reputation_score.saturating_add(points as u64);
        reputation_record.contributions = reputation_record.contributions.saturating_add(1);
    } else {
        identity.reputation_score = identity.reputation_score.saturating_sub((-points) as u64);
    }

    identity.last_updated = Clock::get()?.unix_timestamp;
    reputation_record.score = identity.reputation_score;
    reputation_record.last_contribution = Clock::get()?.unix_timestamp;

    msg!(
        "Reputation updated by {} points. New score: {}",
        points,
        identity.reputation_score
    );
    Ok(())
}
