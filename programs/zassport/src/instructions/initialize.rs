use crate::state::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
#[instruction()]
pub struct InitializeProgram<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + NullifierRegistry::INIT_SPACE,
        seeds = [b"nullifier_registry"],
        bump
    )]
    pub nullifier_registry: Account<'info, NullifierRegistry>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn initialize_program(ctx: Context<InitializeProgram>) -> Result<()> {
    let nullifier_registry = &mut ctx.accounts.nullifier_registry;
    nullifier_registry.nullifiers = Vec::new();
    nullifier_registry.authority = ctx.accounts.authority.key();
    nullifier_registry.bump = ctx.bumps.nullifier_registry;

    msg!("ZKPassport program initialized successfully");
    Ok(())
}
