/**
 * NFC Module Index
 * Re-exports all NFC-related functionality
 */

// Types
export * from './types';

// ICAO 9303 MRZ Parser
export {
  parseMRZ,
  parseTD1,
  parseTD2,
  parseTD3,
  calculateCheckDigit,
  verifyCheckDigit,
  parseMRZDate,
  calculateAge,
  daysUntilExpiry,
  generateBACKeys,
  validateMRZ,
  getCountryName,
  COUNTRY_CODES,
} from './icao9303';

// SOD Verification
export {
  parseX509Certificate,
  parseSOD,
  hashData,
  verifyDataGroupHash,
  verifyEd25519Signature,
  verifyRSASignature,
  verifyECDSASignature,
  performPassiveAuthentication,
  CSCAStore,
  formatHash,
  compareHashes,
} from './sod-verification';

// NFC Reader Service
export { NFCReaderService, nfcReader } from './nfc-reader';
