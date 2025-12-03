/**
 * W3C Verifiable Credentials and Presentations Export
 * Converts Zassport ZK proofs into standard W3C format
 */

import { PublicKey } from '@solana/web3.js';

export interface VerifiableCredential {
  '@context': string[];
  type: string[];
  issuer: string;
  issuanceDate: string;
  expirationDate?: string;
  credentialSubject: {
    id: string;
    [key: string]: any;
  };
  proof: VerifiableProof;
}

export interface VerifiablePresentation {
  '@context': string[];
  type: string[];
  verifiableCredential: VerifiableCredential[];
  holder: string;
  proof: VerifiableProof;
}

export interface VerifiableProof {
  type: string;
  created: string;
  proofPurpose: string;
  verificationMethod: string;
  proofValue: string;
}

export interface ZKProofData {
  proof: any;
  publicSignals: string[];
  commitment: string;
  nullifier: string;
  owner: PublicKey;
  claimType: 'age' | 'nationality' | 'sanctions' | 'expiry';
}

/**
 * Export ZK proof as W3C Verifiable Credential
 */
export function exportAsVerifiableCredential(
  zkProof: ZKProofData,
  programId: PublicKey
): VerifiableCredential {
  const did = `did:solana:${zkProof.owner.toString()}`;
  const issuerDid = `did:solana:${programId.toString()}`;

  // Build credential subject based on claim type
  const credentialSubject: any = {
    id: did,
  };

  switch (zkProof.claimType) {
    case 'age':
      credentialSubject.ageOver18 = true;
      break;
    case 'nationality':
      credentialSubject.nationalityVerified = true;
      break;
    case 'sanctions':
      credentialSubject.sanctionsClean = true;
      break;
    case 'expiry':
      credentialSubject.documentValid = true;
      break;
  }

  return {
    '@context': [
      'https://www.w3.org/2018/credentials/v1',
      'https://zassport.io/contexts/v1',
    ],
    type: ['VerifiableCredential', 'ZKPassportCredential'],
    issuer: issuerDid,
    issuanceDate: new Date().toISOString(),
    credentialSubject,
    proof: {
      type: 'Groth16Proof2021',
      created: new Date().toISOString(),
      proofPurpose: 'assertionMethod',
      verificationMethod: `${issuerDid}#keys-1`,
      proofValue: encodeZKProof(zkProof),
    },
  };
}

/**
 * Export multiple credentials as W3C Verifiable Presentation
 */
export function exportAsVerifiablePresentation(
  credentials: VerifiableCredential[],
  holderDid: string,
  challenge?: string
): VerifiablePresentation {
  return {
    '@context': [
      'https://www.w3.org/2018/credentials/v1',
      'https://zassport.io/contexts/v1',
    ],
    type: ['VerifiablePresentation'],
    verifiableCredential: credentials,
    holder: holderDid,
    proof: {
      type: 'Ed25519Signature2020',
      created: new Date().toISOString(),
      proofPurpose: 'authentication',
      verificationMethod: `${holderDid}#keys-1`,
      proofValue: '', // Would be signed by holder's wallet
    },
  };
}

/**
 * Create DID document for Solana identity
 */
export function createDIDDocument(identity: PublicKey, programId: PublicKey) {
  const did = `did:solana:${identity.toString()}`;

  return {
    '@context': [
      'https://www.w3.org/ns/did/v1',
      'https://w3id.org/security/suites/ed25519-2020/v1',
    ],
    id: did,
    verificationMethod: [
      {
        id: `${did}#keys-1`,
        type: 'Ed25519VerificationKey2020',
        controller: did,
        publicKeyMultibase: identity.toString(),
      },
    ],
    authentication: [`${did}#keys-1`],
    assertionMethod: [`${did}#keys-1`],
    capabilityInvocation: [`${did}#keys-1`],
    service: [
      {
        id: `${did}#zassport`,
        type: 'ZKPassportService',
        serviceEndpoint: `https://solana.com/programs/${programId.toString()}`,
      },
    ],
  };
}

/**
 * Encode ZK proof for W3C format
 */
function encodeZKProof(zkProof: ZKProofData): string {
  const proofData = {
    proof: zkProof.proof,
    publicSignals: zkProof.publicSignals,
    commitment: zkProof.commitment,
    nullifier: zkProof.nullifier,
  };

  return Buffer.from(JSON.stringify(proofData)).toString('base64');
}

/**
 * Decode ZK proof from W3C format
 */
export function decodeZKProof(proofValue: string): any {
  const decoded = Buffer.from(proofValue, 'base64').toString('utf-8');
  return JSON.parse(decoded);
}

/**
 * Verify W3C Verifiable Credential
 */
export async function verifyVerifiableCredential(
  credential: VerifiableCredential
): Promise<boolean> {
  try {
    // 1. Verify credential structure
    if (!credential['@context'] || !credential.type || !credential.proof) {
      return false;
    }

    // 2. Check issuance date
    const issuanceDate = new Date(credential.issuanceDate);
    if (issuanceDate > new Date()) {
      return false;
    }

    // 3. Check expiration if present
    if (credential.expirationDate) {
      const expirationDate = new Date(credential.expirationDate);
      if (expirationDate < new Date()) {
        return false;
      }
    }

    // 4. Verify ZK proof
    const zkProof = decodeZKProof(credential.proof.proofValue);
    // In production: verify using snarkjs or on-chain

    return true;
  } catch (error) {
    console.error('Credential verification failed:', error);
    return false;
  }
}

/**
 * Export credentials to Apple Wallet format (mock)
 */
export function exportToAppleWallet(credential: VerifiableCredential) {
  // Apple Wallet uses .pkpass format
  // This is a simplified representation
  return {
    formatVersion: 1,
    passTypeIdentifier: 'pass.com.zassport.passport',
    serialNumber: credential.credentialSubject.id,
    teamIdentifier: 'ZASSPORT',
    organizationName: 'Zassport',
    description: 'Zassport Identity Credential',
    foregroundColor: 'rgb(255, 255, 255)',
    backgroundColor: 'rgb(60, 65, 76)',
    labelColor: 'rgb(255, 255, 255)',
    generic: {
      primaryFields: [
        {
          key: 'identity',
          label: 'Identity',
          value: 'Verified',
        },
      ],
      secondaryFields: [
        {
          key: 'issued',
          label: 'Issued',
          value: new Date(credential.issuanceDate).toLocaleDateString(),
        },
      ],
    },
  };
}

/**
 * Export credentials to Google Wallet format (mock)
 */
export function exportToGoogleWallet(credential: VerifiableCredential) {
  return {
    iss: 'zassport@zassport-identity.iam.gserviceaccount.com',
    aud: 'google',
    typ: 'savetowallet',
    origins: [],
    payload: {
      genericObjects: [
        {
          id: credential.credentialSubject.id,
          classId: 'zassport_identity_class',
          genericType: 'GENERIC_TYPE_UNSPECIFIED',
          hexBackgroundColor: '#3c414c',
          logo: {
            sourceUri: {
              uri: 'https://zassport.io/logo.png',
            },
          },
          cardTitle: {
            defaultValue: {
              language: 'en-US',
              value: 'Zassport Identity',
            },
          },
          header: {
            defaultValue: {
              language: 'en-US',
              value: 'Verified Identity',
            },
          },
          textModulesData: [
            {
              header: 'Issued',
              body: new Date(credential.issuanceDate).toLocaleDateString(),
            },
          ],
        },
      ],
    },
  };
}
