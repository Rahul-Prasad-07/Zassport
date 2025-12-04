use crate::errors::*;
use crate::state::*;
use crate::zk_verifier;
use anchor_lang::prelude::*;

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

    // Verify the Groth16 proof cryptographically
    let is_valid = zk_verifier::verify_nationality_proof_groth16(
        &proof,
        commitment,
        nullifier,
        allowed_nationality,
    )?;

    require!(is_valid, ZKPassportError::InvalidProof);

    msg!(
        "Nationality proof cryptographically verified: allowed_nationality={}",
        allowed_nationality
    );

    Ok(())
}
