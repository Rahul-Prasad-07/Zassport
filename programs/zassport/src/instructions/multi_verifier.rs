use anchor_lang::prelude::*;
use crate::state::multi_verifier::*;
use crate::state::Identity;
use crate::errors::ZassportError;

/// Initialize Multi-Verifier Configuration
/// Sets up the quorum-based verification system
pub fn initialize_multi_verifier(
    ctx: Context<InitializeMultiVerifier>,
    threshold: u8,
    verifiers: Vec<Pubkey>,
) -> Result<()> {
    require!(threshold >= 1, ZassportError::InvalidThreshold);
    require!(verifiers.len() >= threshold as usize, ZassportError::NotEnoughVerifiers);
    require!(verifiers.len() <= 10, ZassportError::TooManyVerifiers);
    
    let config = &mut ctx.accounts.multi_verifier_config;
    config.authority = ctx.accounts.authority.key();
    config.threshold = threshold;
    config.total_verifiers = verifiers.len() as u8;
    config.verifiers = verifiers;
    config.created_at = Clock::get()?.unix_timestamp;
    config.bump = ctx.bumps.multi_verifier_config;
    
    msg!("Multi-verifier config initialized: {}/{} threshold", threshold, config.total_verifiers);
    Ok(())
}

/// Add a verifier to the multi-verifier set
pub fn add_verifier(
    ctx: Context<ModifyVerifier>,
    new_verifier: Pubkey,
) -> Result<()> {
    let config = &mut ctx.accounts.multi_verifier_config;
    
    require!(config.verifiers.len() < 10, ZassportError::TooManyVerifiers);
    require!(!config.verifiers.contains(&new_verifier), ZassportError::VerifierAlreadyExists);
    
    config.verifiers.push(new_verifier);
    config.total_verifiers = config.verifiers.len() as u8;
    
    msg!("Added verifier: {}", new_verifier);
    Ok(())
}

/// Remove a verifier from the multi-verifier set
pub fn remove_verifier(
    ctx: Context<ModifyVerifier>,
    verifier_to_remove: Pubkey,
) -> Result<()> {
    let config = &mut ctx.accounts.multi_verifier_config;
    
    let idx = config.verifiers.iter().position(|&v| v == verifier_to_remove)
        .ok_or(ZassportError::VerifierNotFound)?;
    
    config.verifiers.remove(idx);
    config.total_verifiers = config.verifiers.len() as u8;
    
    // Ensure threshold is still achievable
    require!(config.total_verifiers >= config.threshold, ZassportError::NotEnoughVerifiers);
    
    msg!("Removed verifier: {}", verifier_to_remove);
    Ok(())
}

/// Update quorum threshold
pub fn update_threshold(
    ctx: Context<ModifyVerifier>,
    new_threshold: u8,
) -> Result<()> {
    let config = &mut ctx.accounts.multi_verifier_config;
    
    require!(new_threshold >= 1, ZassportError::InvalidThreshold);
    require!(new_threshold <= config.total_verifiers, ZassportError::InvalidThreshold);
    
    config.threshold = new_threshold;
    
    msg!("Updated threshold to: {}/{}", new_threshold, config.total_verifiers);
    Ok(())
}

/// Submit attestation as a verifier (contributes to quorum)
pub fn submit_attestation(
    ctx: Context<SubmitAttestation>,
    attestation_type: u8,
    attested_value: u64,
    expiry: i64,
    signature: [u8; 64],
) -> Result<()> {
    let config = &ctx.accounts.multi_verifier_config;
    let verifier = ctx.accounts.verifier.key();
    
    // Verify the signer is an authorized verifier
    require!(config.verifiers.contains(&verifier), ZassportError::UnauthorizedVerifier);
    
    let clock = Clock::get()?;
    let now = clock.unix_timestamp;
    
    // Store the attestation
    let attestation = &mut ctx.accounts.verifier_attestation;
    attestation.identity = ctx.accounts.identity.key();
    attestation.verifier = verifier;
    attestation.attestation_type = attestation_type;
    attestation.attested_value = attested_value;
    attestation.timestamp = now;
    attestation.expiry = expiry;
    attestation.signature = signature;
    attestation.bump = ctx.bumps.verifier_attestation;
    
    // Update quorum status
    let quorum = &mut ctx.accounts.quorum_status;
    let threshold = config.threshold;
    
    match AttestationType::from(attestation_type) {
        AttestationType::Age => {
            quorum.age_attestation_count += 1;
            quorum.age_value = attested_value;
            if quorum.age_attestation_count >= threshold {
                quorum.age_threshold_met = true;
                msg!("Age attestation quorum reached!");
            }
        }
        AttestationType::Nationality => {
            quorum.nationality_attestation_count += 1;
            quorum.nationality_value = attested_value;
            if quorum.nationality_attestation_count >= threshold {
                quorum.nationality_threshold_met = true;
                msg!("Nationality attestation quorum reached!");
            }
        }
        AttestationType::Validity => {
            quorum.validity_attestation_count += 1;
            quorum.validity_expiry = expiry;
            if quorum.validity_attestation_count >= threshold {
                quorum.validity_threshold_met = true;
                msg!("Validity attestation quorum reached!");
            }
        }
        AttestationType::Sanctions => {
            quorum.sanctions_attestation_count += 1;
            quorum.sanctions_clear = attested_value == 1;
            if quorum.sanctions_attestation_count >= threshold {
                quorum.sanctions_threshold_met = true;
                msg!("Sanctions attestation quorum reached!");
            }
        }
    }
    
    quorum.last_updated = now;
    
    msg!("Attestation submitted by verifier: {}", verifier);
    Ok(())
}

/// Initialize quorum status for an identity
pub fn initialize_quorum_status(
    ctx: Context<InitializeQuorumStatus>,
) -> Result<()> {
    let quorum = &mut ctx.accounts.quorum_status;
    quorum.identity = ctx.accounts.identity.key();
    quorum.age_attestation_count = 0;
    quorum.age_threshold_met = false;
    quorum.age_value = 0;
    quorum.nationality_attestation_count = 0;
    quorum.nationality_threshold_met = false;
    quorum.nationality_value = 0;
    quorum.validity_attestation_count = 0;
    quorum.validity_threshold_met = false;
    quorum.validity_expiry = 0;
    quorum.sanctions_attestation_count = 0;
    quorum.sanctions_threshold_met = false;
    quorum.sanctions_clear = false;
    quorum.last_updated = Clock::get()?.unix_timestamp;
    quorum.bump = ctx.bumps.quorum_status;
    
    msg!("Quorum status initialized for identity");
    Ok(())
}

/// Check if an attestation has reached quorum
pub fn check_quorum(
    ctx: Context<CheckQuorum>,
    attestation_type: u8,
) -> Result<bool> {
    let quorum = &ctx.accounts.quorum_status;
    let config = &ctx.accounts.multi_verifier_config;
    
    let has_quorum = match AttestationType::from(attestation_type) {
        AttestationType::Age => quorum.age_threshold_met,
        AttestationType::Nationality => quorum.nationality_threshold_met,
        AttestationType::Validity => quorum.validity_threshold_met,
        AttestationType::Sanctions => quorum.sanctions_threshold_met,
    };
    
    msg!("Quorum check for type {}: {} (threshold: {}/{})", 
         attestation_type, 
         has_quorum, 
         config.threshold,
         config.total_verifiers);
    
    Ok(has_quorum)
}

// Account contexts

#[derive(Accounts)]
pub struct InitializeMultiVerifier<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        init,
        payer = authority,
        space = 8 + MultiVerifierConfig::INIT_SPACE,
        seeds = [b"multi_verifier_config"],
        bump
    )]
    pub multi_verifier_config: Account<'info, MultiVerifierConfig>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ModifyVerifier<'info> {
    #[account(
        constraint = authority.key() == multi_verifier_config.authority @ ZassportError::UnauthorizedVerifier
    )]
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"multi_verifier_config"],
        bump = multi_verifier_config.bump
    )]
    pub multi_verifier_config: Account<'info, MultiVerifierConfig>,
}

#[derive(Accounts)]
#[instruction(attestation_type: u8)]
pub struct SubmitAttestation<'info> {
    #[account(mut)]
    pub verifier: Signer<'info>,
    
    #[account(
        seeds = [b"multi_verifier_config"],
        bump = multi_verifier_config.bump
    )]
    pub multi_verifier_config: Account<'info, MultiVerifierConfig>,
    
    #[account(
        seeds = [b"identity", identity.owner.as_ref()],
        bump = identity.bump
    )]
    pub identity: Account<'info, Identity>,
    
    #[account(
        init,
        payer = verifier,
        space = 8 + VerifierAttestation::INIT_SPACE,
        seeds = [b"verifier_attestation", identity.key().as_ref(), verifier.key().as_ref(), &[attestation_type]],
        bump
    )]
    pub verifier_attestation: Account<'info, VerifierAttestation>,
    
    #[account(
        mut,
        seeds = [b"quorum_status", identity.key().as_ref()],
        bump = quorum_status.bump
    )]
    pub quorum_status: Account<'info, QuorumStatus>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitializeQuorumStatus<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    
    #[account(
        seeds = [b"identity", identity.owner.as_ref()],
        bump = identity.bump
    )]
    pub identity: Account<'info, Identity>,
    
    #[account(
        init,
        payer = payer,
        space = 8 + QuorumStatus::INIT_SPACE,
        seeds = [b"quorum_status", identity.key().as_ref()],
        bump
    )]
    pub quorum_status: Account<'info, QuorumStatus>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CheckQuorum<'info> {
    #[account(
        seeds = [b"multi_verifier_config"],
        bump = multi_verifier_config.bump
    )]
    pub multi_verifier_config: Account<'info, MultiVerifierConfig>,
    
    #[account(
        seeds = [b"quorum_status", quorum_status.identity.as_ref()],
        bump = quorum_status.bump
    )]
    pub quorum_status: Account<'info, QuorumStatus>,
}
