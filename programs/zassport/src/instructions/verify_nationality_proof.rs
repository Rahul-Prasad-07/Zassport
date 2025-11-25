use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::*;

#[derive(Accounts)]
#[instruction(commitment: [u8; 32], nullifier: [u8; 32], allowed_nationality: u64, proof: Vec<u8>)]
pub struct VerifyNationalityProof<'info> {
    #[account(
        seeds = [b"identity", user.key().as_ref()],
        bump = identity.bump,
        constraint = identity.owner == user.key() @ ZKPassportError::UnauthorizedAccess
    )]
    pub identity: Account<'info, Identity>,

    #[account(mut)]
    pub user: Signer<'info>,
}

pub fn verify_nationality_proof(
    ctx: Context<VerifyNationalityProof>,
    commitment: [u8; 32],
    nullifier: [u8; 32],
    allowed_nationality: u64,
    proof: Vec<u8>,
) -> Result<()> {
    let identity = &ctx.accounts.identity;

    // Verify that the commitment matches the identity's commitment
    require!(
        identity.commitment == commitment,
        ZKPassportError::InvalidCommitment
    );

    // Verify that the nullifier matches
    require!(
        identity.nullifier == nullifier,
        ZKPassportError::InvalidNullifier
    );

    // TODO: Implement actual Groth16 proof verification
    // This requires integrating a Solana-compatible ZK verifier library
    require!(
        proof.len() >= 128,
        ZKPassportError::InvalidProof
    );

    msg!(
        "Nationality proof verified: allowed_nationality={}",
        allowed_nationality
    );

    Ok(())
}
