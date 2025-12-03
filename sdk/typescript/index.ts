/**
 * Zassport Enterprise SDK
 * Simple integration for businesses to accept Zassport proofs
 */

import { Connection, PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider } from '@coral-xyz/anchor';

export interface ZassportConfig {
  rpcUrl?: string;
  programId: string;
  verifierEndpoint?: string;
}

export interface IdentityProof {
  identity: string;
  proofType: 'age' | 'nationality' | 'sanctions' | 'expiry';
  isValid: boolean;
  verifiedAt: Date;
  expiresAt?: Date;
}

export interface VerificationOptions {
  requireAge?: number;
  requireNationality?: string;
  requireSanctionsClean?: boolean;
  requireNotExpired?: boolean;
}

/**
 * Main Zassport SDK class
 */
export class ZassportSDK {
  private connection: Connection;
  private programId: PublicKey;
  private verifierEndpoint: string;

  constructor(config: ZassportConfig) {
    this.connection = new Connection(
      config.rpcUrl || 'https://api.mainnet-beta.solana.com',
      'confirmed'
    );
    this.programId = new PublicKey(config.programId);
    this.verifierEndpoint = config.verifierEndpoint || 'https://verifier.zassport.io';
  }

  /**
   * Verify user's identity on-chain
   */
  async verifyIdentity(
    userWallet: string,
    requirements: VerificationOptions
  ): Promise<IdentityProof | null> {
    try {
      const userPubkey = new PublicKey(userWallet);

      // Derive identity PDA
      const [identityPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('identity'), userPubkey.toBuffer()],
        this.programId
      );

      // Fetch identity account
      const accountInfo = await this.connection.getAccountInfo(identityPDA);
      if (!accountInfo) {
        return null;
      }

      // Parse identity data
      const identity = this.parseIdentityAccount(accountInfo.data);

      // Check requirements
      if (requirements.requireAge && !identity.ageVerified) {
        return null;
      }

      if (requirements.requireNationality && !identity.nationalityVerified) {
        return null;
      }

      if (requirements.requireSanctionsClean && !identity.sanctionsClean) {
        return null;
      }

      if (requirements.requireNotExpired && identity.isExpired) {
        return null;
      }

      return {
        identity: userWallet,
        proofType: 'age', // or aggregate type
        isValid: true,
        verifiedAt: new Date(identity.verifiedAt * 1000),
        expiresAt: identity.expiresAt ? new Date(identity.expiresAt * 1000) : undefined,
      };
    } catch (error) {
      console.error('Identity verification failed:', error);
      return null;
    }
  }

  /**
   * Generate verification widget embed code
   */
  getEmbedCode(appId: string, requirements: VerificationOptions): string {
    const config = encodeURIComponent(JSON.stringify(requirements));
    
    return `
<div id="zassport-verify-${appId}"></div>
<script src="https://cdn.zassport.io/widget.js"></script>
<script>
  Zassport.init({
    appId: '${appId}',
    requirements: ${JSON.stringify(requirements)},
    onSuccess: (proof) => {
      console.log('Verification successful:', proof);
      // Handle successful verification
    },
    onError: (error) => {
      console.error('Verification failed:', error);
    }
  });
</script>
    `;
  }

  /**
   * Verify proof off-chain (using verifier service)
   */
  async verifyProofOffChain(proof: any, publicSignals: string[]): Promise<boolean> {
    try {
      const response = await fetch(`${this.verifierEndpoint}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ proof, publicSignals }),
      });

      const result = await response.json();
      return result.valid === true;
    } catch (error) {
      console.error('Off-chain verification failed:', error);
      return false;
    }
  }

  /**
   * Get verification status for user
   */
  async getVerificationStatus(userWallet: string): Promise<{
    hasIdentity: boolean;
    ageVerified: boolean;
    nationalityVerified: boolean;
    sanctionsClean: boolean;
    notExpired: boolean;
  }> {
    const userPubkey = new PublicKey(userWallet);

    const [identityPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('identity'), userPubkey.toBuffer()],
      this.programId
    );

    const accountInfo = await this.connection.getAccountInfo(identityPDA);
    
    if (!accountInfo) {
      return {
        hasIdentity: false,
        ageVerified: false,
        nationalityVerified: false,
        sanctionsClean: false,
        notExpired: false,
      };
    }

    const identity = this.parseIdentityAccount(accountInfo.data);

    return {
      hasIdentity: true,
      ageVerified: identity.ageVerified,
      nationalityVerified: identity.nationalityVerified,
      sanctionsClean: identity.sanctionsClean || false,
      notExpired: !identity.isExpired,
    };
  }

  /**
   * Parse identity account data
   */
  private parseIdentityAccount(data: Buffer): any {
    // Simplified parser - production should use Anchor IDL
    return {
      ageVerified: data[72] === 1,
      nationalityVerified: data[73] === 1,
      verifiedAt: data.readBigInt64LE(64),
      sanctionsClean: false, // Would be parsed from account
      isExpired: false, // Would be checked based on expiry
      expiresAt: null,
    };
  }

  /**
   * Subscribe to identity updates
   */
  subscribeToIdentity(
    userWallet: string,
    callback: (identity: any) => void
  ): number {
    const userPubkey = new PublicKey(userWallet);

    const [identityPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('identity'), userPubkey.toBuffer()],
      this.programId
    );

    return this.connection.onAccountChange(
      identityPDA,
      (accountInfo) => {
        const identity = this.parseIdentityAccount(accountInfo.data);
        callback(identity);
      },
      'confirmed'
    );
  }

  /**
   * Unsubscribe from identity updates
   */
  async unsubscribe(subscriptionId: number): Promise<void> {
    await this.connection.removeAccountChangeListener(subscriptionId);
  }
}

/**
 * Quick verification helper
 */
export async function quickVerify(
  userWallet: string,
  requirements: VerificationOptions,
  programId: string = 'FR6XtcALdJfPRTLzSyhjt5fJ1eoYsEn8kq4vcGAkd8WQ'
): Promise<boolean> {
  const sdk = new ZassportSDK({ programId });
  const proof = await sdk.verifyIdentity(userWallet, requirements);
  return proof !== null && proof.isValid;
}

/**
 * React hook for easy integration
 */
export function useZassportVerification(
  userWallet: string | null,
  requirements: VerificationOptions
) {
  const [status, setStatus] = React.useState<{
    loading: boolean;
    verified: boolean;
    proof: IdentityProof | null;
  }>({
    loading: true,
    verified: false,
    proof: null,
  });

  React.useEffect(() => {
    if (!userWallet) {
      setStatus({ loading: false, verified: false, proof: null });
      return;
    }

    const sdk = new ZassportSDK({
      programId: 'FR6XtcALdJfPRTLzSyhjt5fJ1eoYsEn8kq4vcGAkd8WQ',
    });

    sdk.verifyIdentity(userWallet, requirements).then((proof) => {
      setStatus({
        loading: false,
        verified: proof !== null && proof.isValid,
        proof,
      });
    });
  }, [userWallet, requirements]);

  return status;
}

// Re-export types
export * from './types';
