use crate::errors::*;
use crate::state::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
#[instruction(proposal_id: u64, title: String, description: String, voting_period: i64)]
pub struct CreateProposal<'info> {
    #[account(
        init,
        payer = creator,
        space = 8 + GovernanceProposal::INIT_SPACE + title.len() + description.len(),
        seeds = [b"proposal", proposal_id.to_le_bytes().as_ref()],
        bump
    )]
    pub proposal: Account<'info, GovernanceProposal>,

    #[account(
        seeds = [b"identity", creator.key().as_ref()],
        bump = creator_identity.bump,
        constraint = creator_identity.is_active @ ZKPassportError::IdentityNotActive
    )]
    pub creator_identity: Account<'info, Identity>,

    #[account(mut)]
    pub creator: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn create_proposal(
    ctx: Context<CreateProposal>,
    proposal_id: u64,
    title: String,
    description: String,
    voting_period: i64,
) -> Result<()> {
    let proposal = &mut ctx.accounts.proposal;
    let current_time = Clock::get()?.unix_timestamp;

    require!(title.len() <= 200, ZKPassportError::TitleTooLong);
    require!(
        description.len() <= 1000,
        ZKPassportError::DescriptionTooLong
    );
    require!(voting_period > 0, ZKPassportError::InvalidVotingPeriod);

    proposal.id = proposal_id;
    proposal.title = title;
    proposal.description = description;
    proposal.creator = ctx.accounts.creator.key();
    proposal.created_at = current_time;
    proposal.voting_ends = current_time + voting_period;
    proposal.yes_votes = 0;
    proposal.no_votes = 0;
    proposal.executed = false;
    proposal.bump = ctx.bumps.proposal;

    msg!("Proposal {} created: {}", proposal_id, proposal.title);
    Ok(())
}
