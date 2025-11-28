use crate::state::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct InitializeVerifierConfig<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + VerifierConfig::INIT_SPACE,
        seeds = [b"verifier_config"],
        bump
    )]
    pub verifier_config: Account<'info, VerifierConfig>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn initialize_verifier_config(
    ctx: Context<InitializeVerifierConfig>,
    verifier: Pubkey,
) -> Result<()> {
    let cfg = &mut ctx.accounts.verifier_config;
    cfg.authority = ctx.accounts.authority.key();
    cfg.verifier = verifier;
    cfg.bump = ctx.bumps.verifier_config;
    Ok(())
}

#[derive(Accounts)]
pub struct UpdateVerifier<'info> {
    #[account(
        mut,
        seeds = [b"verifier_config"],
        bump = verifier_config.bump,
        has_one = authority
    )]
    pub verifier_config: Account<'info, VerifierConfig>,

    pub authority: Signer<'info>,
}

pub fn update_verifier(ctx: Context<UpdateVerifier>, new_verifier: Pubkey) -> Result<()> {
    let cfg = &mut ctx.accounts.verifier_config;
    cfg.verifier = new_verifier;
    Ok(())
}
