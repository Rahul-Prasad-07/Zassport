// Production NFC Passport Reader for React Native
// Implements ICAO 9303 e-Passport reading with BAC (Basic Access Control)

import NfcManager, { NfcTech } from 'react-native-nfc-manager';
import { Buffer } from '@craftzdog/react-native-buffer';
import { crypto } from '@/shims/crypto-polyfill';

export interface PassportData {
  // MRZ Data (from DG1)
  documentNumber: string;
  dateOfBirth: string; // YYMMDD format
  dateOfExpiry: string; // YYMMDD format
  nationality: string; // 3-letter country code
  gender: string;
  firstName: string;
  lastName: string;
  
  // Computed fields for ZK proofs
  dobTimestamp: number;
  expiryTimestamp: number;
  nationalityCode: number;
  documentHash: string;
}

export interface MRZData {
  documentNumber: string;
  dateOfBirth: string;
  dateOfExpiry: string;
}

// Country code to numeric mapping for ZK circuits
const COUNTRY_CODES: Record<string, number> = {
  'IND': 356, // India
  'USA': 840, // United States
  'GBR': 826, // United Kingdom
  'DEU': 276, // Germany
  'FRA': 250, // France
  'JPN': 392, // Japan
  'CHN': 156, // China
  'AUS': 36,  // Australia
  'CAN': 124, // Canada
  'BRA': 76,  // Brazil
  // Add more as needed
};

/**
 * Initialize NFC Manager
 */
export async function initNFC(): Promise<boolean> {
  try {
    // Check if NfcManager is available (may not be in Expo Go)
    if (!NfcManager || typeof NfcManager.isSupported !== 'function') {
      console.warn('[NFC] NFC Manager not available (Expo Go limitation)');
      return false;
    }
    const supported = await NfcManager.isSupported();
    if (!supported) {
      console.warn('[NFC] NFC not supported on this device');
      return false;
    }
    await NfcManager.start();
    console.log('[NFC] NFC Manager initialized');
    return true;
  } catch (error) {
    console.warn('[NFC] Failed to initialize (expected in Expo Go):', error);
    return false;
  }
}

/**
 * Calculate BAC session keys from MRZ data
 * Per ICAO 9303 Part 11
 */
function calculateBACKeys(mrz: MRZData): { kEnc: Buffer; kMac: Buffer } {
  // MRZ_information = Document Number + Check Digit + DOB + Check Digit + DOE + Check Digit
  const docNum = mrz.documentNumber.padEnd(9, '<');
  const docNumCheck = calculateCheckDigit(docNum);
  const dobCheck = calculateCheckDigit(mrz.dateOfBirth);
  const doeCheck = calculateCheckDigit(mrz.dateOfExpiry);
  
  const mrzInfo = `${docNum}${docNumCheck}${mrz.dateOfBirth}${dobCheck}${mrz.dateOfExpiry}${doeCheck}`;
  
  // Kseed = SHA1(MRZ_information)[0:16]
  const hashResult = crypto.createHash('sha1').update(mrzInfo).digest();
  const kSeed = Buffer.from(hashResult).slice(0, 16);
  
  // Derive encryption and MAC keys
  const kEnc = deriveKey(kSeed, 1);
  const kMac = deriveKey(kSeed, 2);
  
  return { kEnc, kMac };
}

/**
 * Derive key using KDF per ICAO 9303
 */
function deriveKey(kSeed: Buffer, counter: number): Buffer {
  const d = Buffer.concat([kSeed, Buffer.from([0, 0, 0, counter])]);
  const hashResult = crypto.createHash('sha1').update(d).digest();
  
  // Adjust parity bits for 3DES
  const key = Buffer.from(hashResult).slice(0, 16);
  for (let i = 0; i < 16; i++) {
    let b = key[i];
    let parity = 0;
    for (let j = 0; j < 8; j++) {
      parity ^= (b >> j) & 1;
    }
    if (parity === 0) {
      (key as any)[i] ^= 1;
    }
  }
  return key;
}

/**
 * Calculate check digit per ICAO 9303
 */
function calculateCheckDigit(data: string): string {
  const weights = [7, 3, 1];
  let sum = 0;
  
  for (let i = 0; i < data.length; i++) {
    let value: number;
    const char = data[i];
    
    if (char >= '0' && char <= '9') {
      value = parseInt(char);
    } else if (char >= 'A' && char <= 'Z') {
      value = char.charCodeAt(0) - 55; // A=10, B=11, etc.
    } else if (char === '<') {
      value = 0;
    } else {
      value = 0;
    }
    
    sum += value * weights[i % 3];
  }
  
  return (sum % 10).toString();
}

/**
 * Parse MRZ from DG1 data
 */
function parseMRZ(dg1: Buffer): Partial<PassportData> {
  // DG1 contains the MRZ in a specific TLV structure
  // Skip the tag and length bytes to get to MRZ data
  let offset = 0;
  
  // Find the 5F1F tag (MRZ data)
  while (offset < dg1.length - 2) {
    if (dg1[offset] === 0x5F && dg1[offset + 1] === 0x1F) {
      offset += 2;
      const len = dg1[offset];
      offset += 1;
      const mrzData = dg1.slice(offset, offset + len).toString('ascii');
      return parseMRZString(mrzData);
    }
    offset++;
  }
  
  // Fallback: try to parse as raw MRZ
  return parseMRZString(dg1.toString('ascii'));
}

/**
 * Parse MRZ string (TD3 format for passports)
 */
function parseMRZString(mrz: string): Partial<PassportData> {
  // TD3 format: 2 lines of 44 characters each
  const lines = mrz.replace(/\n/g, '').match(/.{1,44}/g) || [];
  
  if (lines.length < 2) {
    throw new Error('Invalid MRZ format');
  }
  
  const line1 = (lines[0] || '').padEnd(44, '<');
  const line2 = (lines[1] || '').padEnd(44, '<');
  
  // Line 1: P<NATIONALITY<<SURNAME<<GIVEN<NAMES<<<<<<<<<<<<<
  const nationality = line1.substring(2, 5).replace(/</g, '');
  const names = line1.substring(5).split('<<');
  const lastName = names[0].replace(/</g, ' ').trim();
  const firstName = (names[1] || '').replace(/</g, ' ').trim();
  
  // Line 2: DOCUMENT_NUM<CHECK DOB CHECK GENDER DOE CHECK ...
  const documentNumber = line2.substring(0, 9).replace(/</g, '');
  const dateOfBirth = line2.substring(13, 19);
  const gender = line2.substring(20, 21);
  const dateOfExpiry = line2.substring(21, 27);
  
  return {
    documentNumber,
    dateOfBirth,
    dateOfExpiry,
    nationality,
    gender,
    firstName,
    lastName,
  };
}

/**
 * Convert YYMMDD to Unix timestamp
 */
function parseDateToTimestamp(yymmdd: string): number {
  const year = parseInt(yymmdd.substring(0, 2));
  const month = parseInt(yymmdd.substring(2, 4)) - 1;
  const day = parseInt(yymmdd.substring(4, 6));
  
  // Determine century (if year > 50, assume 1900s, else 2000s)
  const fullYear = year > 50 ? 1900 + year : 2000 + year;
  
  return Math.floor(new Date(fullYear, month, day).getTime() / 1000);
}

/**
 * Read passport data via NFC
 */
export async function readPassport(mrz: MRZData): Promise<PassportData> {
  try {
    // Request NFC technology
    await NfcManager.requestTechnology(NfcTech.IsoDep, {
      alertMessage: 'Hold your passport against the back of your phone',
    });
    
    console.log('[NFC] IsoDep technology acquired');
    
    // Select eMRTD application
    const selectCommand = Buffer.from([
      0x00, 0xA4, 0x04, 0x0C, 0x07,
      0xA0, 0x00, 0x00, 0x02, 0x47, 0x10, 0x01
    ]);
    
    const selectResponse = await NfcManager.isoDepHandler.transceive(
      Array.from(selectCommand)
    );
    console.log('[NFC] eMRTD application selected');
    
    // Calculate BAC keys
    const { kEnc, kMac } = calculateBACKeys(mrz);
    
    // Perform BAC authentication
    await performBAC(kEnc, kMac);
    console.log('[NFC] BAC authentication successful');
    
    // Read DG1 (MRZ data)
    const dg1 = await readDataGroup(1);
    console.log('[NFC] DG1 read successfully');
    
    // Parse MRZ data
    const parsedData = parseMRZ(dg1);
    
    // Calculate computed fields
    const dobTimestamp = parseDateToTimestamp(parsedData.dateOfBirth || mrz.dateOfBirth);
    const expiryTimestamp = parseDateToTimestamp(parsedData.dateOfExpiry || mrz.dateOfExpiry);
    const nationalityCode = COUNTRY_CODES[parsedData.nationality || ''] || 0;
    
    // Generate document hash for ZK proofs
    const docData = `${parsedData.documentNumber}${parsedData.dateOfBirth}${parsedData.nationality}`;
    const documentHash = crypto.createHash('sha256').update(docData).digest('hex');
    
    const passportData: PassportData = {
      documentNumber: parsedData.documentNumber || mrz.documentNumber,
      dateOfBirth: parsedData.dateOfBirth || mrz.dateOfBirth,
      dateOfExpiry: parsedData.dateOfExpiry || mrz.dateOfExpiry,
      nationality: parsedData.nationality || '',
      gender: parsedData.gender || '',
      firstName: parsedData.firstName || '',
      lastName: parsedData.lastName || '',
      dobTimestamp,
      expiryTimestamp,
      nationalityCode,
      documentHash,
    };
    
    return passportData;
    
  } finally {
    // Always cancel technology request
    await NfcManager.cancelTechnologyRequest();
  }
}

/**
 * Perform BAC (Basic Access Control) authentication
 */
async function performBAC(kEnc: Buffer, kMac: Buffer): Promise<void> {
  // Get challenge from passport
  const getChallengeCmd = Buffer.from([0x00, 0x84, 0x00, 0x00, 0x08]);
  const response = await NfcManager.isoDepHandler.transceive(Array.from(getChallengeCmd));
  const rndICC = Buffer.from(Array.isArray(response) ? response : Array.from(response as Uint8Array));
  
  if (rndICC.length < 8) {
    throw new Error('Failed to get challenge from passport');
  }
  
  // Generate our random and key
  const rndIFD = crypto.randomBytes(8);
  const kIFD = crypto.randomBytes(16);
  
  // Build authentication data
  const s = Buffer.concat([rndIFD, rndICC.slice(0, 8), kIFD]);
  
  // Encrypt with 3DES
  const cipher = crypto.createCipheriv('des-ede3-cbc', 
    Buffer.concat([kEnc, kEnc.slice(0, 8)]), 
    Buffer.alloc(8)
  );
  const eIFD = Buffer.concat([cipher.update(s), cipher.final()]);
  
  // Calculate MAC
  const mac = calculateMAC(eIFD, kMac);
  
  // Send EXTERNAL AUTHENTICATE
  const authCmd = Buffer.concat([
    Buffer.from([0x00, 0x82, 0x00, 0x00, 0x28]),
    eIFD,
    mac,
    Buffer.from([0x28])
  ]);
  
  const authResp = await NfcManager.isoDepHandler.transceive(Array.from(authCmd));
  const authResponse = Buffer.from(Array.isArray(authResp) ? authResp : Array.from(authResp as Uint8Array));
  
  // Check response status
  if (authResponse.length < 2 || 
      authResponse[authResponse.length - 2] !== 0x90 || 
      authResponse[authResponse.length - 1] !== 0x00) {
    throw new Error('BAC authentication failed');
  }
  
  console.log('[NFC] BAC mutual authentication completed');
}

/**
 * Calculate ISO 9797-1 MAC Algorithm 3
 */
function calculateMAC(data: Buffer, kMac: Buffer): Buffer {
  // Pad data
  const padded = pad(data);
  
  // Initial CBC with first 8 bytes of key
  let intermediate = Buffer.alloc(8);
  const cipher1 = crypto.createCipheriv('des-cbc', kMac.slice(0, 8), Buffer.alloc(8));
  
  for (let i = 0; i < padded.length; i += 8) {
    const block = padded.slice(i, i + 8);
    const xored = Buffer.alloc(8);
    for (let j = 0; j < 8; j++) {
      xored[j] = intermediate[j] ^ block[j];
    }
    intermediate = cipher1.update(xored);
  }
  
  // Final 3DES
  const decipher = crypto.createDecipheriv('des-cbc', kMac.slice(8, 16), Buffer.alloc(8));
  intermediate = decipher.update(intermediate);
  
  const finalCipher = crypto.createCipheriv('des-cbc', kMac.slice(0, 8), Buffer.alloc(8));
  return finalCipher.update(intermediate);
}

/**
 * ISO 9797-1 padding
 */
function pad(data: Buffer): Buffer {
  const padLen = 8 - (data.length % 8);
  const padding = Buffer.alloc(padLen);
  padding[0] = 0x80;
  return Buffer.concat([data, padding]);
}

/**
 * Read a data group from the passport
 */
async function readDataGroup(dgNumber: number): Promise<Buffer> {
  // File IDs for data groups (DG1 = 0x0101, DG2 = 0x0102, etc.)
  const fileId = 0x0100 + dgNumber;
  
  // Select file
  const selectCmd = Buffer.from([
    0x00, 0xA4, 0x02, 0x0C, 0x02,
    (fileId >> 8) & 0xFF,
    fileId & 0xFF
  ]);
  
  await NfcManager.isoDepHandler.transceive(Array.from(selectCmd));
  
  // Read binary
  const chunks: Buffer[] = [];
  let offset = 0;
  const maxRead = 256;
  
  while (true) {
    const readCmd = Buffer.from([
      0x00, 0xB0,
      (offset >> 8) & 0x7F,
      offset & 0xFF,
      maxRead
    ]);
    
    const response = Buffer.from(
      await NfcManager.isoDepHandler.transceive(Array.from(readCmd))
    );
    
    if (response.length < 2) break;
    
    const sw1 = response[response.length - 2];
    const sw2 = response[response.length - 1];
    
    if (sw1 === 0x90 && sw2 === 0x00) {
      chunks.push(response.slice(0, -2));
      offset += response.length - 2;
      
      if (response.length - 2 < maxRead) break;
    } else if (sw1 === 0x6C) {
      // Wrong length, retry with correct length
      const correctLen = sw2;
      const retryCmd = Buffer.from([
        0x00, 0xB0,
        (offset >> 8) & 0x7F,
        offset & 0xFF,
        correctLen
      ]);
      const retryResponse = Buffer.from(
        await NfcManager.isoDepHandler.transceive(Array.from(retryCmd))
      );
      chunks.push(retryResponse.slice(0, -2));
      break;
    } else {
      break;
    }
  }
  
  return Buffer.concat(chunks);
}

/**
 * Simulate passport data for testing (development only)
 */
export function createTestPassportData(): PassportData {
  const now = Math.floor(Date.now() / 1000);
  return {
    documentNumber: 'L898902C3',
    dateOfBirth: '950315', // March 15, 1995
    dateOfExpiry: '280101', // January 1, 2028
    nationality: 'IND',
    gender: 'M',
    firstName: 'RAHUL',
    lastName: 'PRASAD',
    dobTimestamp: parseDateToTimestamp('950315'),
    expiryTimestamp: parseDateToTimestamp('280101'),
    nationalityCode: 356, // India
    documentHash: crypto.createHash('sha256').update('L898902C3950315IND').digest('hex'),
  };
}
