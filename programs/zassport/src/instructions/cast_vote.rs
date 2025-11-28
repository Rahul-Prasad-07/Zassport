use crate::errors::*;
use crate::state::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
#[instruction(proposal_id: u64, vote: VoteType)]
pub struct CastVote<'info> {
    #[account(
        mut,
        seeds = [b"proposal", proposal_id.to_le_bytes().as_ref()],
        bump = proposal.bump,
        constraint = !proposal.executed @ ZKPassportError::ProposalAlreadyExecuted,
        constraint = Clock::get()?.unix_timestamp <= proposal.voting_ends @ ZKPassportError::VotingPeriodEnded
    )]
    pub proposal: Account<'info, GovernanceProposal>,

    #[account(
        seeds = [b"identity", voter.key().as_ref()],
        bump = voter_identity.bump,
        constraint = voter_identity.is_active @ ZKPassportError::IdentityNotActive
    )]
    pub voter_identity: Account<'info, Identity>,

    #[account(
        init,
        payer = voter,
        space = 8 + VoteRecord::INIT_SPACE,
        seeds = [b"vote", proposal_id.to_le_bytes().as_ref(), voter_identity.key().as_ref()],
        bump
    )]
    pub vote_record: Account<'info, VoteRecord>,

    #[account(mut)]
    pub voter: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn cast_vote(ctx: Context<CastVote>, proposal_id: u64, vote: VoteType) -> Result<()> {
    let proposal = &mut ctx.accounts.proposal;
    let vote_record = &mut ctx.accounts.vote_record;

    // Record the vote
    let vote_value = match vote {
        VoteType::Yes => 1,
        VoteType::No => 0,
    };
    vote_record.proposal = proposal_id;
    vote_record.voter_identity = ctx.accounts.voter_identity.key();
    vote_record.vote = vote_value;
    vote_record.voted_at = Clock::get()?.unix_timestamp;
    vote_record.bump = ctx.bumps.vote_record;

    // Update proposal vote counts
    match vote {
        VoteType::Yes => {
            proposal.yes_votes = proposal.yes_votes.saturating_add(1);
        }
        VoteType::No => {
            proposal.no_votes = proposal.no_votes.saturating_add(1);
        }
    }

    msg!("Vote cast for proposal {}: {:?}", proposal_id, vote);
    Ok(())
}
