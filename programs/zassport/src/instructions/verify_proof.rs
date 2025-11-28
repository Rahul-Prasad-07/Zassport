use crate::errors::*;
use crate::state::*;
use crate::zk_verifier;
use anchor_lang::prelude::*;

#[derive(Accounts)]
#[instruction(commitment: [u8; 32], nullifier: [u8; 32], proof: Vec<u8>)]
pub struct VerifyPassportProof<'info> {
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

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn verify_passport_proof(
    ctx: Context<VerifyPassportProof>,
    commitment: [u8; 32],
    nullifier: [u8; 32],
    proof: Vec<u8>,
) -> Result<()> {
    let identity = &mut ctx.accounts.identity;
    let nullifier_registry = &mut ctx.accounts.nullifier_registry;

    // Check if nullifier has been used (prevents duplicate identities)
    require!(
        !nullifier_registry.nullifiers.contains(&nullifier),
        ZKPassportError::NullifierAlreadyUsed
    );

    // Verify the Groth16 proof cryptographically
    // Note: For full passport verification, we'd pass timestamp and age range
    // For now, using default values (min_age=18, max_age=120)
    let current_time = Clock::get()?.unix_timestamp;
    let is_valid = zk_verifier::verify_passport_proof_groth16(
        &proof,
        commitment,
        nullifier,
        current_time,
        18,  // min_age
        120, // max_age
    )?;

    require!(is_valid, ZKPassportError::InvalidProof);

    msg!("Passport proof cryptographically verified");

    // Register the nullifier to prevent reuse
    nullifier_registry.nullifiers.push(nullifier);

    // Create the identity record
    identity.owner = ctx.accounts.user.key();
    identity.commitment = commitment;
    identity.nullifier = nullifier;
    identity.reputation_score = 0;
    identity.last_updated = Clock::get()?.unix_timestamp;
    identity.is_active = true;
    identity.bump = ctx.bumps.identity;

    msg!("Passport proof verified and identity registered successfully");
    Ok(())
}
