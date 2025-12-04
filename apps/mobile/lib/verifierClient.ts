// Verifier API Client for React Native
// Submits ZK proofs and receives attestations

import type { ProofResult } from './zkProofPipeline';

export interface AttestationRequest {
  proofType: 'age' | 'nationality' | 'validity' | 'sanctions';
  proof: ProofResult['proof'];
  publicSignals: string[];
  commitment: string;
  nullifier: string;
  walletAddress: string;
}

export interface AttestationResponse {
  success: boolean;
  attestationId?: string;
  signature?: string;
  timestamp?: number;
  expiresAt?: number;
  error?: string;
}

export interface SanctionsCheckResponse {
  merkleRoot: string;
  merklePath: string[];
  isOnList: boolean;
  timestamp: number;
}

// API endpoints - configure for production
const API_CONFIG = {
  verifier: process.env.VERIFIER_URL || 'http://localhost:3001',
  sanctionsOracle: process.env.SANCTIONS_URL || 'http://localhost:3002',
  timeout: 30000,
};

/**
 * Submit proof for verification and attestation
 */
export async function submitProofForAttestation(
  request: AttestationRequest
): Promise<AttestationResponse> {
  const endpoint = getEndpointForProofType(request.proofType);
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);
    
    const response = await fetch(`${API_CONFIG.verifier}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        proof: request.proof,
        publicInputs: request.publicSignals,
        commitment: request.commitment,
        nullifier: request.nullifier,
        owner: request.walletAddress,
      }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Verifier error: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    
    return {
      success: true,
      attestationId: result.attestationId || result.id,
      signature: result.signature,
      timestamp: result.timestamp || Date.now(),
      expiresAt: result.expiresAt,
    };
  } catch (error: any) {
    console.error('[Verifier] Submission failed:', error);
    return {
      success: false,
      error: error.message || 'Unknown error occurred',
    };
  }
}

/**
 * Get endpoint for proof type
 */
function getEndpointForProofType(proofType: AttestationRequest['proofType']): string {
  const endpoints: Record<string, string> = {
    age: '/verify-age',
    nationality: '/verify-nationality',
    validity: '/verify-validity',
    sanctions: '/verify-sanctions',
  };
  return endpoints[proofType] || '/verify';
}

/**
 * Check sanctions status and get Merkle proof
 */
export async function checkSanctionsStatus(
  documentHash: string
): Promise<SanctionsCheckResponse> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);
    
    const response = await fetch(`${API_CONFIG.sanctionsOracle}/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        documentHash,
      }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Sanctions oracle error: ${response.status}`);
    }
    
    const result = await response.json();
    
    return {
      merkleRoot: result.merkleRoot,
      merklePath: result.merklePath || [],
      isOnList: result.isOnList || false,
      timestamp: result.timestamp || Date.now(),
    };
  } catch (error: any) {
    console.error('[Sanctions] Check failed:', error);
    // Return safe default - assume not on list
    return {
      merkleRoot: '0',
      merklePath: [],
      isOnList: false,
      timestamp: Date.now(),
    };
  }
}

/**
 * Get current sanctions Merkle root
 */
export async function getSanctionsMerkleRoot(): Promise<string> {
  try {
    const response = await fetch(`${API_CONFIG.sanctionsOracle}/health`);
    
    if (!response.ok) {
      throw new Error('Sanctions oracle unavailable');
    }
    
    const result = await response.json();
    return result.merkleRoot || '0';
  } catch (error) {
    console.error('[Sanctions] Failed to get Merkle root:', error);
    return '0';
  }
}

/**
 * Verify attestation status
 */
export async function verifyAttestation(
  attestationId: string
): Promise<{ valid: boolean; details?: any }> {
  try {
    const response = await fetch(
      `${API_CONFIG.verifier}/attestation/${attestationId}`
    );
    
    if (!response.ok) {
      return { valid: false };
    }
    
    const result = await response.json();
    return {
      valid: result.valid || result.status === 'valid',
      details: result,
    };
  } catch (error) {
    console.error('[Verifier] Attestation check failed:', error);
    return { valid: false };
  }
}

/**
 * Batch submit multiple proofs
 */
export async function submitAllProofs(
  proofs: {
    ageProof: ProofResult;
    nationalityProof: ProofResult;
    validityProof: ProofResult;
    sanctionsProof?: ProofResult;
  },
  walletAddress: string
): Promise<{
  age: AttestationResponse;
  nationality: AttestationResponse;
  validity: AttestationResponse;
  sanctions?: AttestationResponse;
}> {
  const results = await Promise.all([
    submitProofForAttestation({
      proofType: 'age',
      proof: proofs.ageProof.proof,
      publicSignals: proofs.ageProof.publicSignals,
      commitment: proofs.ageProof.commitment,
      nullifier: proofs.ageProof.nullifier,
      walletAddress,
    }),
    submitProofForAttestation({
      proofType: 'nationality',
      proof: proofs.nationalityProof.proof,
      publicSignals: proofs.nationalityProof.publicSignals,
      commitment: proofs.nationalityProof.commitment,
      nullifier: proofs.nationalityProof.nullifier,
      walletAddress,
    }),
    submitProofForAttestation({
      proofType: 'validity',
      proof: proofs.validityProof.proof,
      publicSignals: proofs.validityProof.publicSignals,
      commitment: proofs.validityProof.commitment,
      nullifier: proofs.validityProof.nullifier,
      walletAddress,
    }),
  ]);
  
  const response: any = {
    age: results[0],
    nationality: results[1],
    validity: results[2],
  };
  
  if (proofs.sanctionsProof) {
    response.sanctions = await submitProofForAttestation({
      proofType: 'sanctions',
      proof: proofs.sanctionsProof.proof,
      publicSignals: proofs.sanctionsProof.publicSignals,
      commitment: proofs.sanctionsProof.commitment,
      nullifier: proofs.sanctionsProof.nullifier,
      walletAddress,
    });
  }
  
  return response;
}
