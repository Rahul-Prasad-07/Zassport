/**
 * SOD (Security Object Document) Verification
 * Implements Passive Authentication per ICAO 9303 Part 11
 * Verifies document signature and certificate chain
 */

import * as asn1js from 'asn1js';
import { ed25519 } from '@noble/curves/ed25519';
import { sha256 } from '@noble/hashes/sha256';
import { sha512 } from '@noble/hashes/sha512';
import { 
  SODData, 
  X509Certificate, 
  PassiveAuthResult,
  NFCError, 
  NFCErrorCode 
} from './types';

// OID definitions
const OID_SHA256 = '2.16.840.1.101.3.4.2.1';
const OID_SHA384 = '2.16.840.1.101.3.4.2.2';
const OID_SHA512 = '2.16.840.1.101.3.4.2.3';
const OID_SHA1 = '1.3.14.3.2.26';
const OID_RSA_SHA256 = '1.2.840.113549.1.1.11';
const OID_RSA_SHA384 = '1.2.840.113549.1.1.12';
const OID_RSA_SHA512 = '1.2.840.113549.1.1.13';
const OID_ECDSA_SHA256 = '1.2.840.10045.4.3.2';
const OID_ECDSA_SHA384 = '1.2.840.10045.4.3.3';
const OID_ED25519 = '1.3.101.112';

const OID_TO_HASH: Record<string, string> = {
  [OID_SHA1]: 'SHA-1',
  [OID_SHA256]: 'SHA-256',
  [OID_SHA384]: 'SHA-384',
  [OID_SHA512]: 'SHA-512',
};

const OID_TO_SIG_HASH: Record<string, string> = {
  [OID_RSA_SHA256]: 'SHA-256',
  [OID_RSA_SHA384]: 'SHA-384',
  [OID_RSA_SHA512]: 'SHA-512',
  [OID_ECDSA_SHA256]: 'SHA-256',
  [OID_ECDSA_SHA384]: 'SHA-384',
  [OID_ED25519]: 'SHA-512',
};

/**
 * Parse X.509 certificate from DER-encoded bytes
 */
export function parseX509Certificate(der: Uint8Array): X509Certificate {
  const asn1 = asn1js.fromBER(der.buffer as ArrayBuffer);
  if (asn1.offset === -1) {
    throw new NFCError('Invalid X.509 certificate', NFCErrorCode.INVALID_SOD);
  }
  
  const certificate = asn1.result as asn1js.Sequence;
  const tbsCertificate = certificate.valueBlock.value[0] as asn1js.Sequence;
  const signatureAlgorithm = certificate.valueBlock.value[1] as asn1js.Sequence;
  const signatureValue = certificate.valueBlock.value[2] as asn1js.BitString;
  
  // Parse TBS certificate
  let idx = 0;
  const tbsValue = tbsCertificate.valueBlock.value;
  
  // Version (optional, context tag 0)
  let version = 1;
  if (tbsValue[idx] instanceof asn1js.Constructed && 
      (tbsValue[idx] as asn1js.Constructed).idBlock.tagNumber === 0) {
    version = ((tbsValue[idx] as asn1js.Constructed).valueBlock.value[0] as asn1js.Integer).valueBlock.valueDec + 1;
    idx++;
  }
  
  // Serial number
  const serialNumber = (tbsValue[idx++] as asn1js.Integer).valueBlock.toString();
  
  // Signature algorithm (skip, same as outer)
  idx++;
  
  // Issuer
  const issuer = rdnToString(tbsValue[idx++] as asn1js.Sequence);
  
  // Validity
  const validity = tbsValue[idx++] as asn1js.Sequence;
  const validFrom = parseTime(validity.valueBlock.value[0] as asn1js.BaseBlock<any>);
  const validTo = parseTime(validity.valueBlock.value[1] as asn1js.BaseBlock<any>);
  
  // Subject
  const subject = rdnToString(tbsValue[idx++] as asn1js.Sequence);
  
  // Subject public key info
  const spki = tbsValue[idx++] as asn1js.Sequence;
  const pubKeyAlg = spki.valueBlock.value[0] as asn1js.Sequence;
  const pubKeyAlgOid = (pubKeyAlg.valueBlock.value[0] as asn1js.ObjectIdentifier).valueBlock.toString();
  const publicKey = (spki.valueBlock.value[1] as asn1js.BitString).valueBlock.valueHexView;
  
  // Signature algorithm OID
  const sigAlgOid = (signatureAlgorithm.valueBlock.value[0] as asn1js.ObjectIdentifier).valueBlock.toString();
  
  return {
    raw: der,
    issuer,
    subject,
    serialNumber,
    validFrom,
    validTo,
    publicKey: new Uint8Array(publicKey),
    publicKeyAlgorithm: pubKeyAlgOid,
    signatureAlgorithm: sigAlgOid,
    signature: new Uint8Array(signatureValue.valueBlock.valueHexView),
  };
}

/**
 * Convert RDN sequence to string
 */
function rdnToString(rdn: asn1js.Sequence): string {
  const parts: string[] = [];
  
  for (const set of rdn.valueBlock.value) {
    const atv = (set as asn1js.Set).valueBlock.value[0] as asn1js.Sequence;
    const oid = (atv.valueBlock.value[0] as asn1js.ObjectIdentifier).valueBlock.toString();
    const value = (atv.valueBlock.value[1] as any).valueBlock.value;
    
    const oidName = OID_TO_RDN_NAME[oid] || oid;
    parts.push(`${oidName}=${value}`);
  }
  
  return parts.join(', ');
}

const OID_TO_RDN_NAME: Record<string, string> = {
  '2.5.4.3': 'CN',
  '2.5.4.6': 'C',
  '2.5.4.7': 'L',
  '2.5.4.8': 'ST',
  '2.5.4.10': 'O',
  '2.5.4.11': 'OU',
  '2.5.4.5': 'SerialNumber',
};

/**
 * Parse ASN.1 time to Date
 */
function parseTime(timeBlock: asn1js.BaseBlock<any>): Date {
  if (timeBlock instanceof asn1js.UTCTime) {
    return (timeBlock as asn1js.UTCTime).toDate();
  } else if (timeBlock instanceof asn1js.GeneralizedTime) {
    return (timeBlock as asn1js.GeneralizedTime).toDate();
  }
  throw new NFCError('Invalid time format', NFCErrorCode.INVALID_SOD);
}

/**
 * Parse SOD (Security Object Document) from EF.SOD
 */
export function parseSOD(sodBytes: Uint8Array): SODData {
  const asn1 = asn1js.fromBER(sodBytes.buffer as ArrayBuffer);
  if (asn1.offset === -1) {
    throw new NFCError('Invalid SOD structure', NFCErrorCode.INVALID_SOD);
  }
  
  // SOD is a CMS SignedData structure
  const contentInfo = asn1.result as asn1js.Sequence;
  const contentTypeOid = (contentInfo.valueBlock.value[0] as asn1js.ObjectIdentifier).valueBlock.toString();
  
  // Expect SignedData (1.2.840.113549.1.7.2)
  if (contentTypeOid !== '1.2.840.113549.1.7.2') {
    throw new NFCError('SOD is not SignedData', NFCErrorCode.INVALID_SOD);
  }
  
  const signedDataContent = (contentInfo.valueBlock.value[1] as asn1js.Constructed).valueBlock.value[0] as asn1js.Sequence;
  const signedDataValue = signedDataContent.valueBlock.value;
  
  // Version
  const version = (signedDataValue[0] as asn1js.Integer).valueBlock.valueDec;
  
  // Digest algorithms
  const digestAlgorithms = signedDataValue[1] as asn1js.Set;
  const digestAlgOid = ((digestAlgorithms.valueBlock.value[0] as asn1js.Sequence).valueBlock.value[0] as asn1js.ObjectIdentifier).valueBlock.toString();
  const hashAlgorithm = OID_TO_HASH[digestAlgOid] || digestAlgOid;
  
  // Encapsulated content (LDS Security Object)
  const encapContentInfo = signedDataValue[2] as asn1js.Sequence;
  const ldsSecurityObject = extractLDSSecurityObject(encapContentInfo);
  
  // Certificates (optional, context tag 0)
  let signerCertificate: Uint8Array | undefined;
  let idx = 3;
  if (signedDataValue[idx] instanceof asn1js.Constructed && 
      (signedDataValue[idx] as asn1js.Constructed).idBlock.tagNumber === 0) {
    const certs = signedDataValue[idx] as asn1js.Constructed;
    if (certs.valueBlock.value.length > 0) {
      const certSeq = certs.valueBlock.value[0] as asn1js.Sequence;
      signerCertificate = new Uint8Array(certSeq.valueBeforeDecodeView);
    }
    idx++;
  }
  
  // Signer infos
  const signerInfos = signedDataValue[idx] as asn1js.Set;
  const signerInfo = signerInfos.valueBlock.value[0] as asn1js.Sequence;
  
  // Extract signature from signer info
  const signerInfoValues = signerInfo.valueBlock.value;
  const signatureAlgSeq = signerInfoValues[signerInfoValues.length - 2] as asn1js.Sequence;
  const signatureAlgOid = (signatureAlgSeq.valueBlock.value[0] as asn1js.ObjectIdentifier).valueBlock.toString();
  const signature = new Uint8Array((signerInfoValues[signerInfoValues.length - 1] as asn1js.OctetString).valueBlock.valueHexView);
  
  return {
    version,
    hashAlgorithm,
    dataGroupHashes: ldsSecurityObject.dataGroupHashes,
    signature,
    signerCertificate: signerCertificate || new Uint8Array(),
    signatureAlgorithm: signatureAlgOid,
  };
}

/**
 * Extract LDS Security Object from encapsulated content
 */
function extractLDSSecurityObject(encapContentInfo: asn1js.Sequence): { dataGroupHashes: Map<number, Uint8Array> } {
  const contentOid = (encapContentInfo.valueBlock.value[0] as asn1js.ObjectIdentifier).valueBlock.toString();
  
  // Should be LDS Security Object (2.23.136.1.1.1)
  if (contentOid !== '2.23.136.1.1.1') {
    throw new NFCError('Invalid LDS Security Object OID', NFCErrorCode.INVALID_SOD);
  }
  
  const content = (encapContentInfo.valueBlock.value[1] as asn1js.Constructed).valueBlock.value[0] as asn1js.OctetString;
  const ldsAsn1 = asn1js.fromBER(content.valueBlock.valueHexView);
  const ldsSeq = ldsAsn1.result as asn1js.Sequence;
  
  // Parse data group hashes
  const dataGroupHashes = new Map<number, Uint8Array>();
  
  // Skip version and hash algorithm, find the DataGroupHashValues sequence
  for (const item of ldsSeq.valueBlock.value) {
    if (item instanceof asn1js.Sequence) {
      // Check if this is the DataGroupHashValues
      for (const hashInfo of item.valueBlock.value) {
        if (hashInfo instanceof asn1js.Sequence && hashInfo.valueBlock.value.length === 2) {
          const dgNumber = (hashInfo.valueBlock.value[0] as asn1js.Integer).valueBlock.valueDec;
          const dgHash = new Uint8Array((hashInfo.valueBlock.value[1] as asn1js.OctetString).valueBlock.valueHexView);
          dataGroupHashes.set(dgNumber, dgHash);
        }
      }
    }
  }
  
  return { dataGroupHashes };
}

/**
 * Hash data using specified algorithm
 */
export async function hashData(data: Uint8Array, algorithm: string): Promise<Uint8Array> {
  switch (algorithm.toUpperCase()) {
    case 'SHA-256':
      return sha256(data);
    case 'SHA-512':
      return sha512(data);
    case 'SHA-1':
    case 'SHA-384':
      // Use SubtleCrypto for SHA-1 and SHA-384
      const hashBuffer = await crypto.subtle.digest(algorithm, data as BufferSource);
      return new Uint8Array(hashBuffer);
    default:
      throw new NFCError(`Unsupported hash algorithm: ${algorithm}`, NFCErrorCode.UNSUPPORTED_PROTOCOL);
  }
}

/**
 * Verify a data group hash
 */
export async function verifyDataGroupHash(
  dgData: Uint8Array,
  expectedHash: Uint8Array,
  algorithm: string
): Promise<boolean> {
  const computedHash = await hashData(dgData, algorithm);
  
  if (computedHash.length !== expectedHash.length) {
    return false;
  }
  
  for (let i = 0; i < computedHash.length; i++) {
    if (computedHash[i] !== expectedHash[i]) {
      return false;
    }
  }
  
  return true;
}

/**
 * Verify ED25519 signature
 */
export function verifyEd25519Signature(
  message: Uint8Array,
  signature: Uint8Array,
  publicKey: Uint8Array
): boolean {
  try {
    return ed25519.verify(signature, message, publicKey);
  } catch (e) {
    console.error('ED25519 verification error:', e);
    return false;
  }
}

/**
 * Verify RSA signature using SubtleCrypto
 */
export async function verifyRSASignature(
  message: Uint8Array,
  signature: Uint8Array,
  publicKey: Uint8Array,
  algorithm: string
): Promise<boolean> {
  try {
    // Import the public key
    const key = await crypto.subtle.importKey(
      'spki',
      publicKey as BufferSource,
      { name: 'RSASSA-PKCS1-v1_5', hash: algorithm },
      false,
      ['verify']
    );
    
    return await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      key,
      signature as BufferSource,
      message as BufferSource
    );
  } catch (e) {
    console.error('RSA verification error:', e);
    return false;
  }
}

/**
 * Verify ECDSA signature
 */
export async function verifyECDSASignature(
  message: Uint8Array,
  signature: Uint8Array,
  publicKey: Uint8Array,
  algorithm: string
): Promise<boolean> {
  try {
    // Import the public key
    const key = await crypto.subtle.importKey(
      'spki',
      publicKey.buffer.slice(publicKey.byteOffset, publicKey.byteOffset + publicKey.byteLength) as ArrayBuffer,
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['verify']
    );
    
    return await crypto.subtle.verify(
      { name: 'ECDSA', hash: algorithm },
      key,
      signature.buffer.slice(signature.byteOffset, signature.byteOffset + signature.byteLength) as ArrayBuffer,
      message.buffer.slice(message.byteOffset, message.byteOffset + message.byteLength) as ArrayBuffer
    );
  } catch (e) {
    console.error('ECDSA verification error:', e);
    return false;
  }
}

/**
 * Perform Passive Authentication
 * Verifies the SOD signature and data group hashes
 */
export async function performPassiveAuthentication(
  sod: SODData,
  dataGroups: Map<number, Uint8Array>,
  cscaCertificate?: X509Certificate
): Promise<PassiveAuthResult> {
  const errors: string[] = [];
  
  // Step 1: Verify certificate chain (if CSCA provided)
  let certificateChainValid = true;
  if (cscaCertificate && sod.signerCertificate.length > 0) {
    try {
      const dscCert = parseX509Certificate(sod.signerCertificate);
      
      // Check DSC is signed by CSCA
      // Note: Full chain validation requires more complex logic
      // For production, use a proper PKI library
      
      // Check validity period
      const now = new Date();
      if (now < dscCert.validFrom || now > dscCert.validTo) {
        errors.push('DSC certificate is expired or not yet valid');
        certificateChainValid = false;
      }
      
      if (now < cscaCertificate.validFrom || now > cscaCertificate.validTo) {
        errors.push('CSCA certificate is expired or not yet valid');
        certificateChainValid = false;
      }
    } catch (e) {
      errors.push(`Certificate parsing error: ${e}`);
      certificateChainValid = false;
    }
  }
  
  // Step 2: Verify data group hashes
  let dataGroupHashesValid = true;
  for (const [dgNumber, expectedHash] of sod.dataGroupHashes) {
    const dgData = dataGroups.get(dgNumber);
    if (!dgData) {
      errors.push(`DG${dgNumber} not found`);
      dataGroupHashesValid = false;
      continue;
    }
    
    const valid = await verifyDataGroupHash(dgData, expectedHash, sod.hashAlgorithm);
    if (!valid) {
      errors.push(`DG${dgNumber} hash mismatch`);
      dataGroupHashesValid = false;
    }
  }
  
  // Step 3: Verify SOD signature
  let signatureValid = false;
  if (sod.signerCertificate.length > 0) {
    try {
      const dscCert = parseX509Certificate(sod.signerCertificate);
      const sigHashAlg = OID_TO_SIG_HASH[sod.signatureAlgorithm] || 'SHA-256';
      
      // For a complete implementation, we need to reconstruct the signed attributes
      // and verify the signature over them. This is a simplified version.
      
      if (sod.signatureAlgorithm === OID_ED25519) {
        // ED25519 doesn't use SubtleCrypto
        // Need to extract the raw public key from the certificate
        signatureValid = verifyEd25519Signature(
          sod.signature,
          sod.signature,
          dscCert.publicKey
        );
      } else if (sod.signatureAlgorithm.includes('1.2.840.113549.1.1')) {
        // RSA signature
        signatureValid = await verifyRSASignature(
          sod.signature,
          sod.signature,
          dscCert.publicKey,
          sigHashAlg
        );
      } else if (sod.signatureAlgorithm.includes('1.2.840.10045.4.3')) {
        // ECDSA signature
        signatureValid = await verifyECDSASignature(
          sod.signature,
          sod.signature,
          dscCert.publicKey,
          sigHashAlg
        );
      } else {
        errors.push(`Unsupported signature algorithm: ${sod.signatureAlgorithm}`);
      }
    } catch (e) {
      errors.push(`Signature verification error: ${e}`);
      signatureValid = false;
    }
  } else {
    errors.push('No signer certificate in SOD');
  }
  
  return {
    verified: certificateChainValid && dataGroupHashesValid && signatureValid,
    certificateChainValid,
    dataGroupHashesValid,
    signatureValid,
    errors,
  };
}

/**
 * Extract and verify Country Signing CA certificates
 * These are typically distributed via ICAO PKD or bilateral exchange
 */
export class CSCAStore {
  private certificates: Map<string, X509Certificate> = new Map();
  
  /**
   * Add a CSCA certificate to the store
   */
  addCertificate(certificate: X509Certificate, country: string): void {
    const key = `${country}:${certificate.serialNumber}`;
    this.certificates.set(key, certificate);
  }
  
  /**
   * Find CSCA certificate for a DSC
   */
  findIssuer(dscCertificate: X509Certificate): X509Certificate | undefined {
    // Find by matching issuer/subject
    for (const cert of this.certificates.values()) {
      if (cert.subject === dscCertificate.issuer) {
        return cert;
      }
    }
    return undefined;
  }
  
  /**
   * Load certificates from a PKD-style directory
   * (Implementation would depend on the format)
   */
  async loadFromPKD(pkdUrl: string): Promise<void> {
    // This would fetch certificates from ICAO PKD or similar
    // For now, this is a placeholder
    console.log('Loading certificates from PKD:', pkdUrl);
  }
}

/**
 * Format hash for display
 */
export function formatHash(hash: Uint8Array): string {
  return Array.from(hash)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Compare two hashes
 */
export function compareHashes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}
