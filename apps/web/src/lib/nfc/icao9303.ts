/**
 * ICAO 9303 MRZ Parser
 * Parses Machine Readable Zone data from TD1, TD2, and TD3 documents
 * Implements full ICAO Doc 9303 Part 3 specification
 */

import { MRZData, NFCError, NFCErrorCode } from './types';

// Character to digit mapping for MRZ
const MRZ_CHAR_MAP: Record<string, number> = {
  '0': 0, '1': 1, '2': 2, '3': 3, '4': 4,
  '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
  '<': 0,
  'A': 10, 'B': 11, 'C': 12, 'D': 13, 'E': 14,
  'F': 15, 'G': 16, 'H': 17, 'I': 18, 'J': 19,
  'K': 20, 'L': 21, 'M': 22, 'N': 23, 'O': 24,
  'P': 25, 'Q': 26, 'R': 27, 'S': 28, 'T': 29,
  'U': 30, 'V': 31, 'W': 32, 'X': 33, 'Y': 34, 'Z': 35,
};

// Weights for check digit calculation
const WEIGHTS = [7, 3, 1];

/**
 * Calculate check digit for MRZ field
 * Uses ICAO 9303 weighted sum algorithm
 */
export function calculateCheckDigit(value: string): number {
  let sum = 0;
  for (let i = 0; i < value.length; i++) {
    const char = value[i].toUpperCase();
    const digit = MRZ_CHAR_MAP[char];
    if (digit === undefined) {
      throw new NFCError(
        `Invalid MRZ character: ${char}`,
        NFCErrorCode.INVALID_MRZ
      );
    }
    sum += digit * WEIGHTS[i % 3];
  }
  return sum % 10;
}

/**
 * Verify check digit
 */
export function verifyCheckDigit(value: string, checkDigit: string): boolean {
  const expected = calculateCheckDigit(value);
  const actual = parseInt(checkDigit, 10);
  return expected === actual;
}

/**
 * Parse date from MRZ format (YYMMDD)
 */
export function parseMRZDate(dateStr: string, isPast: boolean = true): Date {
  const year = parseInt(dateStr.substring(0, 2), 10);
  const month = parseInt(dateStr.substring(2, 4), 10) - 1;
  const day = parseInt(dateStr.substring(4, 6), 10);
  
  // Determine century
  const currentYear = new Date().getFullYear() % 100;
  const currentCentury = Math.floor(new Date().getFullYear() / 100) * 100;
  
  let fullYear: number;
  if (isPast) {
    // For birth dates, assume past
    fullYear = year <= currentYear ? currentCentury + year : currentCentury - 100 + year;
  } else {
    // For expiry dates, assume future (within reason)
    fullYear = year >= currentYear - 10 ? currentCentury + year : currentCentury + 100 + year;
  }
  
  return new Date(fullYear, month, day);
}

/**
 * Calculate age from birth date
 */
export function calculateAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * Calculate days until expiry
 */
export function daysUntilExpiry(expiryDate: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  expiryDate.setHours(0, 0, 0, 0);
  
  const diffTime = expiryDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Clean MRZ name field (remove fillers, handle special characters)
 */
export function cleanMRZName(name: string): string {
  return name
    .replace(/</g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Parse names from MRZ (surname<<given_names)
 */
export function parseMRZNames(nameField: string): { surname: string; givenNames: string } {
  const parts = nameField.split('<<');
  const surname = cleanMRZName(parts[0] || '');
  const givenNames = cleanMRZName(parts.slice(1).join(' '));
  return { surname, givenNames };
}

/**
 * Parse TD3 MRZ (Passport - 2 lines of 44 characters)
 */
export function parseTD3(lines: string[]): MRZData {
  if (lines.length !== 2) {
    throw new NFCError(
      'TD3 MRZ requires exactly 2 lines',
      NFCErrorCode.INVALID_MRZ
    );
  }
  
  const line1 = lines[0].padEnd(44, '<');
  const line2 = lines[1].padEnd(44, '<');
  
  if (line1.length !== 44 || line2.length !== 44) {
    throw new NFCError(
      'TD3 MRZ lines must be 44 characters',
      NFCErrorCode.INVALID_MRZ
    );
  }
  
  // Line 1: Type (2) + Country (3) + Names (39)
  const documentType = line1[0] as MRZData['documentType'];
  const issuingCountry = line1.substring(2, 5).replace(/</g, '');
  const { surname, givenNames } = parseMRZNames(line1.substring(5, 44));
  
  // Line 2: Doc# (9) + Check (1) + Nationality (3) + DOB (6) + Check (1) + 
  //         Sex (1) + Expiry (6) + Check (1) + Personal# (14) + Check (1) + Composite (1)
  const documentNumber = line2.substring(0, 9).replace(/</g, '');
  const docNumberCheck = line2[9];
  const nationality = line2.substring(10, 13).replace(/</g, '');
  const dateOfBirth = line2.substring(13, 19);
  const dobCheck = line2[19];
  const sex = line2[20] as MRZData['sex'];
  const expirationDate = line2.substring(21, 27);
  const expiryCheck = line2[27];
  const personalNumber = line2.substring(28, 42).replace(/</g, '') || undefined;
  const personalCheck = line2[42];
  const compositeCheck = line2[43];
  
  // Verify check digits
  const errors: string[] = [];
  
  if (!verifyCheckDigit(documentNumber.padEnd(9, '<'), docNumberCheck)) {
    errors.push('Invalid document number check digit');
  }
  
  if (!verifyCheckDigit(dateOfBirth, dobCheck)) {
    errors.push('Invalid date of birth check digit');
  }
  
  if (!verifyCheckDigit(expirationDate, expiryCheck)) {
    errors.push('Invalid expiration date check digit');
  }
  
  if (personalNumber && !verifyCheckDigit(personalNumber.padEnd(14, '<'), personalCheck)) {
    errors.push('Invalid personal number check digit');
  }
  
  // Composite check digit (doc# + check + DOB + check + expiry + check + personal + check)
  const compositeString = line2.substring(0, 10) + line2.substring(13, 20) + 
                          line2.substring(21, 43);
  if (!verifyCheckDigit(compositeString, compositeCheck)) {
    errors.push('Invalid composite check digit');
  }
  
  if (errors.length > 0) {
    console.warn('MRZ validation warnings:', errors);
  }
  
  // Calculate derived fields
  const birthDate = parseMRZDate(dateOfBirth, true);
  const expiry = parseMRZDate(expirationDate, false);
  const age = calculateAge(birthDate);
  const daysToExpiry = daysUntilExpiry(expiry);
  
  return {
    documentType,
    issuingCountry,
    surname,
    givenNames,
    documentNumber,
    nationality,
    dateOfBirth,
    sex,
    expirationDate,
    personalNumber,
    fullName: `${givenNames} ${surname}`.trim(),
    age,
    isExpired: daysToExpiry < 0,
    daysUntilExpiry: daysToExpiry,
  };
}

/**
 * Parse TD1 MRZ (ID Card - 3 lines of 30 characters)
 */
export function parseTD1(lines: string[]): MRZData {
  if (lines.length !== 3) {
    throw new NFCError(
      'TD1 MRZ requires exactly 3 lines',
      NFCErrorCode.INVALID_MRZ
    );
  }
  
  const line1 = lines[0].padEnd(30, '<');
  const line2 = lines[1].padEnd(30, '<');
  const line3 = lines[2].padEnd(30, '<');
  
  // Line 1: Type (2) + Country (3) + Doc# (9) + Check (1) + Optional (15)
  const documentType = line1[0] as MRZData['documentType'];
  const issuingCountry = line1.substring(2, 5).replace(/</g, '');
  const documentNumber = line1.substring(5, 14).replace(/</g, '');
  const docNumberCheck = line1[14];
  const optionalData1 = line1.substring(15, 30).replace(/</g, '') || undefined;
  
  // Line 2: DOB (6) + Check (1) + Sex (1) + Expiry (6) + Check (1) + 
  //         Nationality (3) + Optional (11) + Composite (1)
  const dateOfBirth = line2.substring(0, 6);
  const dobCheck = line2[6];
  const sex = line2[7] as MRZData['sex'];
  const expirationDate = line2.substring(8, 14);
  const expiryCheck = line2[14];
  const nationality = line2.substring(15, 18).replace(/</g, '');
  const optionalData2 = line2.substring(18, 29).replace(/</g, '') || undefined;
  const compositeCheck = line2[29];
  
  // Line 3: Names (30)
  const { surname, givenNames } = parseMRZNames(line3);
  
  // Verify check digits
  if (!verifyCheckDigit(documentNumber.padEnd(9, '<'), docNumberCheck)) {
    console.warn('Invalid document number check digit');
  }
  
  if (!verifyCheckDigit(dateOfBirth, dobCheck)) {
    console.warn('Invalid date of birth check digit');
  }
  
  if (!verifyCheckDigit(expirationDate, expiryCheck)) {
    console.warn('Invalid expiration date check digit');
  }
  
  // Calculate derived fields
  const birthDate = parseMRZDate(dateOfBirth, true);
  const expiry = parseMRZDate(expirationDate, false);
  const age = calculateAge(birthDate);
  const daysToExpiry = daysUntilExpiry(expiry);
  
  return {
    documentType,
    issuingCountry,
    surname,
    givenNames,
    documentNumber,
    nationality,
    dateOfBirth,
    sex,
    expirationDate,
    personalNumber: undefined,
    optionalData1,
    optionalData2,
    fullName: `${givenNames} ${surname}`.trim(),
    age,
    isExpired: daysToExpiry < 0,
    daysUntilExpiry: daysToExpiry,
  };
}

/**
 * Parse TD2 MRZ (Travel Document - 2 lines of 36 characters)
 */
export function parseTD2(lines: string[]): MRZData {
  if (lines.length !== 2) {
    throw new NFCError(
      'TD2 MRZ requires exactly 2 lines',
      NFCErrorCode.INVALID_MRZ
    );
  }
  
  const line1 = lines[0].padEnd(36, '<');
  const line2 = lines[1].padEnd(36, '<');
  
  // Line 1: Type (2) + Country (3) + Names (31)
  const documentType = line1[0] as MRZData['documentType'];
  const issuingCountry = line1.substring(2, 5).replace(/</g, '');
  const { surname, givenNames } = parseMRZNames(line1.substring(5, 36));
  
  // Line 2: Doc# (9) + Check (1) + Nationality (3) + DOB (6) + Check (1) + 
  //         Sex (1) + Expiry (6) + Check (1) + Optional (7) + Composite (1)
  const documentNumber = line2.substring(0, 9).replace(/</g, '');
  const docNumberCheck = line2[9];
  const nationality = line2.substring(10, 13).replace(/</g, '');
  const dateOfBirth = line2.substring(13, 19);
  const dobCheck = line2[19];
  const sex = line2[20] as MRZData['sex'];
  const expirationDate = line2.substring(21, 27);
  const expiryCheck = line2[27];
  const optionalData1 = line2.substring(28, 35).replace(/</g, '') || undefined;
  const compositeCheck = line2[35];
  
  // Verify check digits
  if (!verifyCheckDigit(documentNumber.padEnd(9, '<'), docNumberCheck)) {
    console.warn('Invalid document number check digit');
  }
  
  if (!verifyCheckDigit(dateOfBirth, dobCheck)) {
    console.warn('Invalid date of birth check digit');
  }
  
  if (!verifyCheckDigit(expirationDate, expiryCheck)) {
    console.warn('Invalid expiration date check digit');
  }
  
  // Calculate derived fields
  const birthDate = parseMRZDate(dateOfBirth, true);
  const expiry = parseMRZDate(expirationDate, false);
  const age = calculateAge(birthDate);
  const daysToExpiry = daysUntilExpiry(expiry);
  
  return {
    documentType,
    issuingCountry,
    surname,
    givenNames,
    documentNumber,
    nationality,
    dateOfBirth,
    sex,
    expirationDate,
    optionalData1,
    fullName: `${givenNames} ${surname}`.trim(),
    age,
    isExpired: daysToExpiry < 0,
    daysUntilExpiry: daysToExpiry,
  };
}

/**
 * Auto-detect and parse MRZ
 */
export function parseMRZ(mrzLines: string[]): MRZData {
  // Clean lines
  const lines = mrzLines
    .map(line => line.trim().toUpperCase())
    .filter(line => line.length > 0);
  
  // Detect format based on line count and length
  if (lines.length === 3 && lines[0].length >= 28 && lines[0].length <= 30) {
    return parseTD1(lines);
  } else if (lines.length === 2 && lines[0].length >= 34 && lines[0].length <= 36) {
    return parseTD2(lines);
  } else if (lines.length === 2 && lines[0].length >= 42 && lines[0].length <= 44) {
    return parseTD3(lines);
  } else {
    throw new NFCError(
      `Unrecognized MRZ format: ${lines.length} lines, ${lines[0]?.length || 0} chars`,
      NFCErrorCode.INVALID_MRZ
    );
  }
}

/**
 * Generate BAC keys from MRZ data
 * K_seed = SHA1(doc_number + doc_number_check + DOB + DOB_check + expiry + expiry_check)
 */
export async function generateBACKeys(mrz: MRZData): Promise<{ kEnc: Uint8Array; kMac: Uint8Array }> {
  // Reconstruct check digits
  const docNumberPadded = mrz.documentNumber.padEnd(9, '<');
  const docCheck = calculateCheckDigit(docNumberPadded).toString();
  const dobCheck = calculateCheckDigit(mrz.dateOfBirth).toString();
  const expiryCheck = calculateCheckDigit(mrz.expirationDate).toString();
  
  // K_seed input
  const kSeedInput = docNumberPadded + docCheck + mrz.dateOfBirth + dobCheck + 
                     mrz.expirationDate + expiryCheck;
  
  // Convert to bytes
  const encoder = new TextEncoder();
  const inputBytes = encoder.encode(kSeedInput);
  
  // SHA-1 hash - cast to BufferSource to satisfy TypeScript
  const hashBuffer = await crypto.subtle.digest('SHA-1', inputBytes as BufferSource);
  const kSeed = new Uint8Array(hashBuffer).slice(0, 16); // Take first 16 bytes
  
  // Derive encryption key (counter = 0x00000001)
  const kEncInput = new Uint8Array([...kSeed, 0x00, 0x00, 0x00, 0x01]);
  const kEncHash = await crypto.subtle.digest('SHA-1', kEncInput as BufferSource);
  const kEnc = adjustParityBits(new Uint8Array(kEncHash).slice(0, 16));
  
  // Derive MAC key (counter = 0x00000002)
  const kMacInput = new Uint8Array([...kSeed, 0x00, 0x00, 0x00, 0x02]);
  const kMacHash = await crypto.subtle.digest('SHA-1', kMacInput as BufferSource);
  const kMac = adjustParityBits(new Uint8Array(kMacHash).slice(0, 16));
  
  return { kEnc, kMac };
}

/**
 * Adjust parity bits for 3DES keys (ISO/IEC 7816-8)
 */
function adjustParityBits(key: Uint8Array): Uint8Array {
  const adjusted = new Uint8Array(key.length);
  for (let i = 0; i < key.length; i++) {
    let byte = key[i];
    // Count set bits
    let count = 0;
    let temp = byte;
    while (temp) {
      count += temp & 1;
      temp >>= 1;
    }
    // Set parity bit (LSB) for odd parity
    if (count % 2 === 0) {
      byte ^= 1;
    }
    adjusted[i] = byte;
  }
  return adjusted;
}

/**
 * Validate MRZ data completeness
 */
export function validateMRZ(mrz: MRZData): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!mrz.documentNumber || mrz.documentNumber.length < 1) {
    errors.push('Missing document number');
  }
  
  if (!mrz.nationality || mrz.nationality.length !== 3) {
    errors.push('Invalid nationality code');
  }
  
  if (!mrz.dateOfBirth || mrz.dateOfBirth.length !== 6) {
    errors.push('Invalid date of birth');
  }
  
  if (!mrz.expirationDate || mrz.expirationDate.length !== 6) {
    errors.push('Invalid expiration date');
  }
  
  if (!['M', 'F', 'X', '<'].includes(mrz.sex)) {
    errors.push('Invalid sex indicator');
  }
  
  if (mrz.age < 0 || mrz.age > 150) {
    errors.push('Invalid calculated age');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Country code to name mapping (subset of common countries)
 */
export const COUNTRY_CODES: Record<string, string> = {
  USA: 'United States',
  GBR: 'United Kingdom',
  CAN: 'Canada',
  AUS: 'Australia',
  DEU: 'Germany',
  FRA: 'France',
  JPN: 'Japan',
  CHN: 'China',
  IND: 'India',
  BRA: 'Brazil',
  MEX: 'Mexico',
  KOR: 'South Korea',
  RUS: 'Russia',
  ITA: 'Italy',
  ESP: 'Spain',
  NLD: 'Netherlands',
  CHE: 'Switzerland',
  SWE: 'Sweden',
  NOR: 'Norway',
  DNK: 'Denmark',
  FIN: 'Finland',
  AUT: 'Austria',
  BEL: 'Belgium',
  PRT: 'Portugal',
  GRC: 'Greece',
  POL: 'Poland',
  CZE: 'Czech Republic',
  HUN: 'Hungary',
  ROU: 'Romania',
  BGR: 'Bulgaria',
  HRV: 'Croatia',
  SVK: 'Slovakia',
  SVN: 'Slovenia',
  IRL: 'Ireland',
  NZL: 'New Zealand',
  SGP: 'Singapore',
  HKG: 'Hong Kong',
  TWN: 'Taiwan',
  THA: 'Thailand',
  MYS: 'Malaysia',
  IDN: 'Indonesia',
  PHL: 'Philippines',
  VNM: 'Vietnam',
  ARE: 'United Arab Emirates',
  SAU: 'Saudi Arabia',
  ISR: 'Israel',
  TUR: 'Turkey',
  ZAF: 'South Africa',
  EGY: 'Egypt',
  ARG: 'Argentina',
  CHL: 'Chile',
  COL: 'Colombia',
  PER: 'Peru',
  // Add more as needed
};

/**
 * Get country name from ISO 3166-1 alpha-3 code
 */
export function getCountryName(code: string): string {
  return COUNTRY_CODES[code.toUpperCase()] || code;
}
