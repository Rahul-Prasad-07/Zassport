// Passport data parser for ICAO 9303 compliant passports
// This module handles parsing NFC data from e-Passports

export interface PassportData {
  documentNumber: string;
  dateOfBirth: string; // YYMMDD format
  dateOfExpiry: string; // YYMMDD format
  nationality: string; // 3-letter country code
  surname: string;
  givenNames: string;
  sex: string;
  documentType: string;
  issuingState: string;
  signature?: Uint8Array; // RSA signature from chip
  rawData?: any;
}

export interface ParsedPassportForZK {
  dateOfBirthTimestamp: bigint;
  expiryDateTimestamp: bigint;
  nationalityCode: bigint;
  documentNumber: bigint;
  signature: bigint[];
}

/**
 * Parse ICAO 9303 MRZ (Machine Readable Zone) data
 * MRZ format for TD3 (passport):
 * Line 1: P<ISSUERXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
 * Line 2: PASSPORTNUMBER<NATIONALITY<BIRTHDATE<SEX<EXPIRY<<<<<<<<<<<<
 */
export function parseMRZ(mrzLine1: string, mrzLine2: string): Partial<PassportData> {
  // Parse line 1
  const documentType = mrzLine1.substring(0, 2);
  const issuingState = mrzLine1.substring(2, 5);
  const namesSection = mrzLine1.substring(5, 44).replace(/</g, ' ').trim();
  const [surname, ...givenNamesArr] = namesSection.split('  ');
  const givenNames = givenNamesArr.join(' ');

  // Parse line 2
  const documentNumber = mrzLine2.substring(0, 9).replace(/</g, '');
  const nationality = mrzLine2.substring(10, 13);
  const dateOfBirth = mrzLine2.substring(13, 19); // YYMMDD
  const sex = mrzLine2.substring(20, 21);
  const dateOfExpiry = mrzLine2.substring(21, 27); // YYMMDD

  return {
    documentType,
    issuingState,
    surname,
    givenNames,
    documentNumber,
    nationality,
    dateOfBirth,
    sex,
    dateOfExpiry,
  };
}

/**
 * Convert YYMMDD date format to Unix timestamp
 */
export function convertYYMMDDToTimestamp(yymmdd: string): bigint {
  const year = parseInt(yymmdd.substring(0, 2));
  const month = parseInt(yymmdd.substring(2, 4));
  const day = parseInt(yymmdd.substring(4, 6));

  // Handle century (assume 1900s for year >= 50, 2000s for year < 50)
  const fullYear = year >= 50 ? 1900 + year : 2000 + year;

  const date = new Date(fullYear, month - 1, day);
  return BigInt(Math.floor(date.getTime() / 1000));
}

/**
 * Convert string to bigint for circuit inputs
 */
export function stringToBigInt(str: string): bigint {
  let result = BigInt(0);
  for (let i = 0; i < str.length; i++) {
    result = result * BigInt(256) + BigInt(str.charCodeAt(i));
  }
  return result;
}

/**
 * Convert nationality code to numeric value
 */
export function nationalityToNumber(code: string): bigint {
  // Convert 3-letter code to number (e.g., USA -> numeric representation)
  return stringToBigInt(code);
}

/**
 * Parse RSA signature from passport chip
 */
export function parseSignature(signatureBytes: Uint8Array): bigint[] {
  // Convert signature bytes to array of bigints for circuit
  const signature: bigint[] = [];
  const chunkSize = 32; // Process in 32-byte chunks

  for (let i = 0; i < signatureBytes.length; i += chunkSize) {
    const chunk = signatureBytes.slice(i, Math.min(i + chunkSize, signatureBytes.length));
    let value = BigInt(0);
    for (let j = 0; j < chunk.length; j++) {
      value = (value << BigInt(8)) + BigInt(chunk[j]);
    }
    signature.push(value);
  }

  return signature;
}

/**
 * Parse full passport data for ZK proof generation
 */
export function parsePassportForZK(passport: PassportData): ParsedPassportForZK {
  return {
    dateOfBirthTimestamp: convertYYMMDDToTimestamp(passport.dateOfBirth),
    expiryDateTimestamp: convertYYMMDDToTimestamp(passport.dateOfExpiry),
    nationalityCode: nationalityToNumber(passport.nationality),
    documentNumber: stringToBigInt(passport.documentNumber),
    signature: passport.signature ? parseSignature(passport.signature) : [],
  };
}

/**
 * Validate MRZ checksum
 */
export function validateMRZChecksum(data: string, checkDigit: string): boolean {
  const weights = [7, 3, 1];
  let sum = 0;

  for (let i = 0; i < data.length; i++) {
    const char = data[i];
    let value: number;

    if (char >= '0' && char <= '9') {
      value = parseInt(char);
    } else if (char >= 'A' && char <= 'Z') {
      value = char.charCodeAt(0) - 'A'.charCodeAt(0) + 10;
    } else if (char === '<') {
      value = 0;
    } else {
      return false;
    }

    sum += value * weights[i % 3];
  }

  return (sum % 10).toString() === checkDigit;
}

/**
 * Read NFC data from passport chip (placeholder for mobile implementation)
 * This will be implemented in the mobile app using react-native-nfc-manager
 */
export async function readPassportNFC(): Promise<PassportData> {
  // This is a placeholder - actual implementation will be in mobile app
  throw new Error('NFC reading must be implemented in mobile app');
}

/**
 * Example passport data for testing
 */
export function getTestPassportData(): PassportData {
  return {
    documentNumber: 'L898902C3',
    dateOfBirth: '740812', // Aug 12, 1974
    dateOfExpiry: '250315', // Mar 15, 2025
    nationality: 'USA',
    surname: 'ERIKSSON',
    givenNames: 'ANNA MARIA',
    sex: 'F',
    documentType: 'P',
    issuingState: 'USA',
  };
}

/**
 * Calculate current age from date of birth
 */
export function calculateAgeFromYYMMDD(yymmdd: string): number {
  const birthTimestamp = convertYYMMDDToTimestamp(yymmdd);
  const currentTimestamp = BigInt(Math.floor(Date.now() / 1000));
  const ageInSeconds = currentTimestamp - birthTimestamp;
  const ageInYears = Number(ageInSeconds) / (365.25 * 24 * 60 * 60);
  return Math.floor(ageInYears);
}
