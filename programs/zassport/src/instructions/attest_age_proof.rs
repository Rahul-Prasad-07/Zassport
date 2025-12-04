use crate::errors::*;
use crate::state::*;
use anchor_lang::prelude::*;
use anchor_lang::solana_program::{
    pubkey,
    sysvar::{self, instructions::load_instruction_at_checked},
};

const MAX_SKEW_SECS: i64 = 600; // 10 minutes

#[derive(Accounts)]
pub struct AttestAge<'info> {
    #[account(
        mut,
        seeds = [b"identity", user.key().as_ref()],
        bump = identity.bump,
        constraint = identity.is_active @ ZKPassportError::IdentityNotActive,
        constraint = identity.owner == user.key() @ ZKPassportError::UnauthorizedAccess,
    )]
    pub identity: Account<'info, Identity>,

    #[account(
        seeds = [b"verifier_config"],
        bump = verifier_config.bump,
    )]
    pub verifier_config: Account<'info, VerifierConfig>,

    #[account(mut)]
    pub user: Signer<'info>,

    /// CHECK: Sysvar address enforced, read-only
    #[account(address = sysvar::instructions::ID)]
    pub instructions: UncheckedAccount<'info>,
}

pub fn attest_age(ctx: Context<AttestAge>, min_age: u64, timestamp: i64) -> Result<()> {
    let cfg = &ctx.accounts.verifier_config;
    let identity = &mut ctx.accounts.identity;

    // Timestamp window check
    let now = Clock::get()?.unix_timestamp;
    require!(
        timestamp >= now - MAX_SKEW_SECS && timestamp <= now + MAX_SKEW_SECS,
        ZKPassportError::AttestationTimestampInvalid
    );

    // Reconstruct message
    let message = build_age_message(
        &ctx.program_id,
        &identity.owner,
        &identity.key(),
        &identity.commitment,
        &identity.nullifier,
        min_age,
        timestamp,
    );

    // Find and validate ed25519 sig instruction
    verify_ed25519_sig_from_instructions(
        &ctx.accounts.instructions,
        cfg.verifier,
        &message,
    )?;

    // Mark attested
    identity.age_verified = true;
    identity.last_attestation_ts = now;

    Ok(())
}

fn build_age_message(
    program_id: &Pubkey,
    owner: &Pubkey,
    identity: &Pubkey,
    commitment: &[u8; 32],
    nullifier: &[u8; 32],
    min_age: u64,
    timestamp: i64,
) -> Vec<u8> {
    let mut m = Vec::with_capacity(8 + 32 + 32 + 32 + 32 + 8 + 8);
    m.extend_from_slice(b"ZASSPORT|AGE|v1");
    m.extend_from_slice(program_id.as_ref());
    m.extend_from_slice(owner.as_ref());
    m.extend_from_slice(identity.as_ref());
    m.extend_from_slice(commitment);
    m.extend_from_slice(nullifier);
    m.extend_from_slice(&min_age.to_le_bytes());
    m.extend_from_slice(&timestamp.to_le_bytes());
    m
}

fn verify_ed25519_sig_from_instructions(
    instructions_sysvar: &UncheckedAccount,
    expected_pubkey: Pubkey,
    expected_message: &[u8],
) -> Result<()> {
    // Iterate over all instructions in the tx and find an ed25519 sig verify
    // Loop until load returns Err
    let mut idx: usize = 0;
    loop {
        let ix = match load_instruction_at_checked(idx, instructions_sysvar.as_ref()) {
            Ok(i) => i,
            Err(_) => break,
        };
        const ED25519_ID: anchor_lang::prelude::Pubkey = pubkey!("Ed25519SigVerify111111111111111111111111111");
        if ix.program_id == ED25519_ID {
            if let Some((pk, msg)) = parse_ed25519_instruction(&ix.data) {
                if pk == expected_pubkey.to_bytes() && msg.as_slice() == expected_message {
                    return Ok(());
                }
            }
        }
        idx += 1;
    }
    Err(error!(ZKPassportError::MissingEd25519Instruction))
}

fn parse_ed25519_instruction(data: &[u8]) -> Option<([u8; 32], Vec<u8>)> {
    if data.len() < 2 + 14 {
        return None;
    }
    let sig_count = data[0];
    let _padding = data[1];
    if sig_count != 1 { return None; }

    // Offsets are little-endian u16
    let mut rd = 2usize;
    let read_u16 = |d: &[u8], off: &mut usize| -> u16 {
        let v = u16::from_le_bytes([d[*off], d[*off + 1]]);
        *off += 2;
        v
    };

    let _sig_offset = read_u16(data, &mut rd);
    let sig_instr_idx = read_u16(data, &mut rd);
    let pk_offset = read_u16(data, &mut rd) as usize;
    let pk_instr_idx = read_u16(data, &mut rd);
    let msg_offset = read_u16(data, &mut rd) as usize;
    let msg_size = read_u16(data, &mut rd) as usize;
    let msg_instr_idx = read_u16(data, &mut rd);

    // Allow either 0 (legacy) or 0xFFFF (current) to indicate in-instruction references
    let in_ix = |idx: u16| idx == 0 || idx == u16::MAX;
    if !in_ix(sig_instr_idx) || !in_ix(pk_instr_idx) || !in_ix(msg_instr_idx) {
        return None;
    }
    if data.len() < pk_offset + 32 || data.len() < msg_offset + msg_size {
        return None;
    }
    let mut pk = [0u8; 32];
    pk.copy_from_slice(&data[pk_offset..pk_offset + 32]);
    let msg = data[msg_offset..msg_offset + msg_size].to_vec();
    Some((pk, msg))
}
