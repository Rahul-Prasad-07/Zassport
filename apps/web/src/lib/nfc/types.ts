/**
 * NFC Reader Types for ICAO 9303 Passport Reading
 * Implements ISO 14443 Type B and ICAO 9303 standards
 */

// APDU Command/Response types
export interface APDUCommand {
  cla: number;        // Class byte
  ins: number;        // Instruction byte
  p1: number;         // Parameter 1
  p2: number;         // Parameter 2
  data?: Uint8Array;  // Command data (optional)
  le?: number;        // Expected response length (optional)
}

export interface APDUResponse {
  data: Uint8Array;   // Response data
  sw1: number;        // Status word 1
  sw2: number;        // Status word 2
}

// Machine Readable Zone (MRZ) types
export interface MRZData {
  documentType: 'P' | 'V' | 'I' | 'A' | 'C';  // Passport, Visa, ID, etc.
  issuingCountry: string;     // ISO 3166-1 alpha-3
  surname: string;
  givenNames: string;
  documentNumber: string;
  nationality: string;        // ISO 3166-1 alpha-3
  dateOfBirth: string;        // YYMMDD
  sex: 'M' | 'F' | 'X';
  expirationDate: string;     // YYMMDD
  personalNumber?: string;
  optionalData1?: string;
  optionalData2?: string;
  // Computed fields
  fullName: string;
  age: number;
  isExpired: boolean;
  daysUntilExpiry: number;
}

// Data Groups from passport chip
export interface DataGroup {
  number: number;
  name: string;
  data: Uint8Array;
  parsed?: any;
}

export interface DG1Data {
  mrz: MRZData;
  rawMRZ: string[];
}

export interface DG2Data {
  faceImage: Uint8Array;
  imageFormat: 'JPEG' | 'JPEG2000' | 'WSQ';
  width: number;
  height: number;
}

export interface DG3Data {
  fingerprints: {
    position: string;
    image: Uint8Array;
    quality: number;
  }[];
}

export interface DG7Data {
  signatureImage: Uint8Array;
  imageFormat: string;
}

export interface DG11Data {
  fullName: string;
  otherNames?: string[];
  personalNumber?: string;
  placeOfBirth?: string;
  permanentAddress?: string;
}

export interface DG12Data {
  issuingAuthority: string;
  dateOfIssue: string;
  endorsements?: string;
  taxExitRequirements?: string;
}

export interface DG14Data {
  securityInfos: SecurityInfo[];
  activeAuthenticationPublicKey?: Uint8Array;
}

export interface DG15Data {
  activeAuthenticationPublicKey: Uint8Array;
  keyAlgorithm: 'RSA' | 'ECDSA';
}

// Security Object Document (SOD)
export interface SODData {
  version: number;
  hashAlgorithm: string;
  dataGroupHashes: Map<number, Uint8Array>;
  signature: Uint8Array;
  signerCertificate: Uint8Array;
  signatureAlgorithm: string;
}

export interface SecurityInfo {
  oid: string;
  data: any;
  protocol?: string;
}

// Passport reading result
export interface PassportData {
  mrz: MRZData;
  dg1?: DG1Data;
  dg2?: DG2Data;
  dg3?: DG3Data;
  dg7?: DG7Data;
  dg11?: DG11Data;
  dg12?: DG12Data;
  dg14?: DG14Data;
  dg15?: DG15Data;
  sod?: SODData;
  // Verification results
  passiveAuthResult?: PassiveAuthResult;
  activeAuthResult?: ActiveAuthResult;
  chipAuthResult?: ChipAuthResult;
}

export interface PassiveAuthResult {
  verified: boolean;
  certificateChainValid: boolean;
  dataGroupHashesValid: boolean;
  signatureValid: boolean;
  errors: string[];
}

export interface ActiveAuthResult {
  verified: boolean;
  challengeResponse: boolean;
  errors: string[];
}

export interface ChipAuthResult {
  verified: boolean;
  sessionKeyEstablished: boolean;
  errors: string[];
}

// Reader status
export interface ReaderStatus {
  connected: boolean;
  readerName?: string;
  cardPresent: boolean;
  cardType?: string;
  atr?: Uint8Array;
  error?: string;
}

// BAC (Basic Access Control) keys
export interface BACKeys {
  kEnc: Uint8Array;  // Encryption key
  kMac: Uint8Array;  // MAC key
}

// PACE (Password Authenticated Connection Establishment) keys
export interface PACEKeys {
  kEnc: Uint8Array;
  kMac: Uint8Array;
}

// Secure messaging session
export interface SecureSession {
  type: 'BAC' | 'PACE';
  kEnc: Uint8Array;
  kMac: Uint8Array;
  ssc: Uint8Array;  // Send sequence counter
}

// Certificate types
export interface X509Certificate {
  raw: Uint8Array;
  issuer: string;
  subject: string;
  serialNumber: string;
  validFrom: Date;
  validTo: Date;
  publicKey: Uint8Array;
  publicKeyAlgorithm: string;
  signatureAlgorithm: string;
  signature: Uint8Array;
  extensions?: CertificateExtension[];
}

export interface CertificateExtension {
  oid: string;
  critical: boolean;
  value: Uint8Array;
}

// Country Signing CA (CSCA) and Document Signer Certificate (DSC)
export interface CSCAInfo {
  country: string;
  certificate: X509Certificate;
  ldapUrl?: string;
}

export interface DSCInfo {
  certificate: X509Certificate;
  cscaReference?: string;
}

// Events
export type NFCEvent = 
  | { type: 'reader_connected'; reader: string }
  | { type: 'reader_disconnected'; reader: string }
  | { type: 'card_inserted'; atr: Uint8Array }
  | { type: 'card_removed' }
  | { type: 'reading_started' }
  | { type: 'reading_progress'; step: string; progress: number }
  | { type: 'reading_complete'; data: PassportData }
  | { type: 'reading_error'; error: string }
  | { type: 'authentication_required'; method: 'BAC' | 'PACE' }
  | { type: 'authentication_success' }
  | { type: 'authentication_failed'; error: string };

export type NFCEventHandler = (event: NFCEvent) => void;

// Error types
export class NFCError extends Error {
  constructor(
    message: string,
    public code: NFCErrorCode,
    public details?: any
  ) {
    super(message);
    this.name = 'NFCError';
  }
}

export enum NFCErrorCode {
  NO_READER = 'NO_READER',
  NO_CARD = 'NO_CARD',
  CARD_REMOVED = 'CARD_REMOVED',
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  READING_FAILED = 'READING_FAILED',
  INVALID_MRZ = 'INVALID_MRZ',
  INVALID_SOD = 'INVALID_SOD',
  VERIFICATION_FAILED = 'VERIFICATION_FAILED',
  UNSUPPORTED_PROTOCOL = 'UNSUPPORTED_PROTOCOL',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN = 'UNKNOWN',
}

// File IDs for passport elementary files
export const EF_COM = 0x011E;     // Common
export const EF_SOD = 0x011D;     // Security Object Document
export const EF_DG1 = 0x0101;     // MRZ
export const EF_DG2 = 0x0102;     // Face image
export const EF_DG3 = 0x0103;     // Fingerprints
export const EF_DG4 = 0x0104;     // Iris
export const EF_DG5 = 0x0105;     // Portrait
export const EF_DG6 = 0x0106;     // Reserved
export const EF_DG7 = 0x0107;     // Signature
export const EF_DG8 = 0x0108;     // Data features
export const EF_DG9 = 0x0109;     // Structure features
export const EF_DG10 = 0x010A;    // Substance features
export const EF_DG11 = 0x010B;    // Additional personal
export const EF_DG12 = 0x010C;    // Additional document
export const EF_DG13 = 0x010D;    // Optional details
export const EF_DG14 = 0x010E;    // Security options
export const EF_DG15 = 0x010F;    // Active auth public key
export const EF_DG16 = 0x0110;    // Persons to notify

// APDU commands
export const SELECT_APPLICATION: APDUCommand = {
  cla: 0x00,
  ins: 0xA4,
  p1: 0x04,
  p2: 0x0C,
  data: new Uint8Array([0xA0, 0x00, 0x00, 0x02, 0x47, 0x10, 0x01]), // eMRTD AID
};

export const GET_CHALLENGE: APDUCommand = {
  cla: 0x00,
  ins: 0x84,
  p1: 0x00,
  p2: 0x00,
  le: 8,
};

export const EXTERNAL_AUTHENTICATE: APDUCommand = {
  cla: 0x00,
  ins: 0x82,
  p1: 0x00,
  p2: 0x00,
};

// Utility type for async operations
export interface ReadingProgress {
  step: string;
  current: number;
  total: number;
  message: string;
}
