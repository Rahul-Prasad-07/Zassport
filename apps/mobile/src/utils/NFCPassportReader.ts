// @ts-nocheck - Legacy file, use lib/passportReader.ts instead
import NfcManager, { NfcTech, Ndef } from 'react-native-nfc-manager';
import { Buffer } from 'buffer';

/**
 * ICAO 9303 Compliant Passport Reader
 * Implements passive authentication (BAC + SOD verification)
 */

export interface PassportData {
  mrz: MRZData;
  dg1: Buffer;  // Machine Readable Zone
  dg2?: Buffer; // Face image
  dg15?: Buffer; // Active authentication public key
  sod: SODData;
  isValid: boolean;
}

export interface MRZData {
  documentType: string;
  documentNumber: string;
  dateOfBirth: string;
  dateOfExpiry: string;
  nationality: string;
  sex: string;
  surname: string;
  givenNames: string;
}

export interface SODData {
  dataGroupHashes: Map<number, Buffer>;
  signerCertificate: Buffer;
  signature: Buffer;
  signatureAlgorithm: string;
  isValid: boolean;
}

export class NFCPassportReader {
  private static instance: NFCPassportReader;

  private constructor() {}

  static getInstance(): NFCPassportReader {
    if (!NFCPassportReader.instance) {
      NFCPassportReader.instance = new NFCPassportReader();
    }
    return NFCPassportReader.instance;
  }

  /**
   * Initialize NFC manager
   */
  async initialize(): Promise<boolean> {
    try {
      const supported = await NfcManager.isSupported();
      if (supported) {
        await NfcManager.start();
      }
      return supported;
    } catch (error) {
      console.error('NFC initialization failed:', error);
      return false;
    }
  }

  /**
   * Read passport using NFC
   */
  async readPassport(
    mrzInfo: { documentNumber: string; dateOfBirth: string; dateOfExpiry: string }
  ): Promise<PassportData> {
    try {
      // Request NFC technology
      await NfcManager.requestTechnology(NfcTech.IsoDep);

      // Step 1: Select eMRTD application
      await this.selectApplication();

      // Step 2: Perform Basic Access Control (BAC)
      const sessionKeys = await this.performBAC(mrzInfo);

      // Step 3: Read Data Groups
      const dg1 = await this.readDataGroup(1, sessionKeys);
      const dg2 = await this.readDataGroup(2, sessionKeys); // Optional: face image
      const dg15 = await this.readDataGroup(15, sessionKeys); // Optional: AA public key

      // Step 4: Read Security Object Data (SOD)
      const sodBuffer = await this.readDataGroup(29, sessionKeys); // EF.SOD

      // Step 5: Parse and verify SOD
      const sod = await this.parseSOD(sodBuffer);

      // Step 6: Verify data group hashes
      const isValid = this.verifyDataGroupHashes(sod, { dg1, dg2, dg15 });

      // Step 7: Parse MRZ
      const mrz = this.parseMRZ(dg1);

      return {
        mrz,
        dg1,
        dg2,
        dg15,
        sod: { ...sod, isValid },
        isValid,
      };
    } catch (error) {
      console.error('Passport reading failed:', error);
      throw error;
    } finally {
      await NfcManager.cancelTechnologyRequest();
    }
  }

  /**
   * Select eMRTD application (ICAO 9303)
   */
  private async selectApplication(): Promise<void> {
    const selectCommand = Buffer.from([
      0x00, // CLA
      0xa4, // INS (SELECT)
      0x04, // P1 (select by name)
      0x0c, // P2
      0x07, // Lc (length)
      0xa0, 0x00, 0x00, 0x02, 0x47, 0x10, 0x01, // AID for eMRTD
    ]);

    const response = await NfcManager.isoDepHandler.transceive(
      Array.from(selectCommand)
    );

    if (response[response.length - 2] !== 0x90 || response[response.length - 1] !== 0x00) {
      throw new Error('Failed to select eMRTD application');
    }
  }

  /**
   * Perform Basic Access Control (BAC)
   * Uses document number, date of birth, and date of expiry to derive session keys
   */
  private async performBAC(mrzInfo: {
    documentNumber: string;
    dateOfBirth: string;
    dateOfExpiry: string;
  }): Promise<{ kEnc: Buffer; kMac: Buffer }> {
    // Compute MRZ information for BAC
    const mrzData = `${mrzInfo.documentNumber}${this.computeCheckDigit(
      mrzInfo.documentNumber
    )}${mrzInfo.dateOfBirth}${this.computeCheckDigit(mrzInfo.dateOfBirth)}${
      mrzInfo.dateOfExpiry
    }${this.computeCheckDigit(mrzInfo.dateOfExpiry)}`;

    // Derive BAC keys using SHA-1 and 3DES
    const kSeed = this.sha1(mrzData);
    const kEnc = this.deriveKey(kSeed, 1); // Encryption key
    const kMac = this.deriveKey(kSeed, 2); // MAC key

    // Perform mutual authentication
    // Note: Full BAC implementation requires challenge-response protocol
    // This is a simplified version for demonstration

    return { kEnc, kMac };
  }

  /**
   * Read specific data group from passport
   */
  private async readDataGroup(
    dataGroup: number,
    sessionKeys: { kEnc: Buffer; kMac: Buffer }
  ): Promise<Buffer> {
    // Select file (data group)
    const fileId = this.getDataGroupFileId(dataGroup);
    const selectCommand = Buffer.from([
      0x00, // CLA
      0xa4, // INS (SELECT)
      0x02, // P1 (select by file ID)
      0x0c, // P2
      0x02, // Lc
      ...fileId,
    ]);

    // Send command (would be encrypted with sessionKeys in full implementation)
    let response = await NfcManager.isoDepHandler.transceive(
      Array.from(selectCommand)
    );

    // Read binary data
    const readCommand = Buffer.from([
      0x00, // CLA
      0xb0, // INS (READ BINARY)
      0x00, // P1 (offset high)
      0x00, // P2 (offset low)
      0x00, // Le (read all)
    ]);

    response = await NfcManager.isoDepHandler.transceive(Array.from(readCommand));

    // Remove status bytes (90 00)
    return Buffer.from(response.slice(0, -2));
  }

  /**
   * Get file ID for data group
   */
  private getDataGroupFileId(dataGroup: number): number[] {
    const fileIds: { [key: number]: number[] } = {
      1: [0x01, 0x01], // DG1 (MRZ)
      2: [0x01, 0x02], // DG2 (Face)
      15: [0x01, 0x0f], // DG15 (Active Auth)
      29: [0x01, 0x1d], // EF.SOD
    };
    return fileIds[dataGroup] || [0x01, dataGroup];
  }

  /**
   * Parse Security Object Data (SOD)
   */
  private async parseSOD(sodBuffer: Buffer): Promise<SODData> {
    // SOD is a CMS SignedData structure (PKCS#7)
    // Parse using ASN.1 decoder
    
    // This is a simplified parser - production should use a proper ASN.1 library
    const dataGroupHashes = new Map<number, Buffer>();
    
    // Extract data group hashes from SOD
    // In real implementation, parse the LDSSecurityObject structure
    for (let i = 1; i <= 16; i++) {
      // Mock hash extraction - replace with actual ASN.1 parsing
      const hash = Buffer.alloc(32); // SHA-256 hash
      dataGroupHashes.set(i, hash);
    }

    return {
      dataGroupHashes,
      signerCertificate: Buffer.alloc(0), // Extract from SOD
      signature: Buffer.alloc(0), // Extract from SOD
      signatureAlgorithm: 'sha256WithRSAEncryption',
      isValid: false, // Will be verified separately
    };
  }

  /**
   * Verify data group hashes against SOD
   */
  private verifyDataGroupHashes(
    sod: SODData,
    dataGroups: { dg1: Buffer; dg2?: Buffer; dg15?: Buffer }
  ): boolean {
    // Compute hash of each data group
    const dg1Hash = this.sha256(dataGroups.dg1);
    const sodDg1Hash = sod.dataGroupHashes.get(1);

    if (!sodDg1Hash || !dg1Hash.equals(sodDg1Hash)) {
      return false;
    }

    if (dataGroups.dg2) {
      const dg2Hash = this.sha256(dataGroups.dg2);
      const sodDg2Hash = sod.dataGroupHashes.get(2);
      if (!sodDg2Hash || !dg2Hash.equals(sodDg2Hash)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Parse MRZ data from DG1
   */
  private parseMRZ(dg1: Buffer): MRZData {
    // DG1 contains MRZ in plain text
    const mrzString = dg1.toString('ascii');
    
    // Parse TD1, TD2, or TD3 format
    // This is simplified - production should handle all formats
    
    return {
      documentType: mrzString.substring(0, 2).trim(),
      documentNumber: mrzString.substring(5, 14).trim(),
      dateOfBirth: mrzString.substring(30, 36),
      dateOfExpiry: mrzString.substring(38, 44),
      nationality: mrzString.substring(15, 18),
      sex: mrzString.substring(20, 21),
      surname: mrzString.substring(5, 30).split('<<')[0].replace(/</g, ' ').trim(),
      givenNames: mrzString.substring(5, 30).split('<<')[1]?.replace(/</g, ' ').trim() || '',
    };
  }

  /**
   * Compute check digit for MRZ field
   */
  private computeCheckDigit(value: string): string {
    const weights = [7, 3, 1];
    let sum = 0;

    for (let i = 0; i < value.length; i++) {
      const char = value[i];
      let digit = 0;

      if (char >= '0' && char <= '9') {
        digit = parseInt(char, 10);
      } else if (char >= 'A' && char <= 'Z') {
        digit = char.charCodeAt(0) - 55;
      } else if (char === '<') {
        digit = 0;
      }

      sum += digit * weights[i % 3];
    }

    return (sum % 10).toString();
  }

  /**
   * Cryptographic helpers
   */
  private sha1(data: string): Buffer {
    // Use crypto library
    const crypto = require('crypto');
    return crypto.createHash('sha1').update(data).digest();
  }

  private sha256(data: Buffer): Buffer {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(data).digest();
  }

  private deriveKey(seed: Buffer, keyType: number): Buffer {
    // Derive encryption or MAC key using KDF
    const crypto = require('crypto');
    const input = Buffer.concat([seed, Buffer.from([0, 0, 0, keyType])]);
    return crypto.createHash('sha1').update(input).digest().slice(0, 16);
  }

  /**
   * Cleanup
   */
  async cleanup(): Promise<void> {
    await NfcManager.cancelTechnologyRequest();
  }
}

export default NFCPassportReader.getInstance();
