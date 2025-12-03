/**
 * Tests for ICAO 9303 MRZ Parser
 */

import {
  parseMRZ,
  parseTD3,
  parseTD1,
  parseTD2,
  calculateCheckDigit,
  verifyCheckDigit,
  parseMRZDate,
  calculateAge,
  daysUntilExpiry,
  validateMRZ,
  generateBACKeys,
  getCountryName,
} from '../src/lib/nfc/icao9303';

describe('ICAO 9303 MRZ Parser', () => {
  describe('Check Digit Calculation', () => {
    it('should calculate check digit for document number', () => {
      // Example: L898902C3 -> 6
      expect(calculateCheckDigit('L898902C3')).toBe(6);
    });

    it('should handle filler characters', () => {
      // Filler < counts as 0
      expect(calculateCheckDigit('123456789')).toBe(calculateCheckDigit('123456789<<<'));
    });

    it('should verify correct check digits', () => {
      expect(verifyCheckDigit('L898902C3', '6')).toBe(true);
    });

    it('should reject incorrect check digits', () => {
      expect(verifyCheckDigit('L898902C3', '5')).toBe(false);
    });
  });

  describe('TD3 Parsing (Passport)', () => {
    const validTD3 = [
      'P<USASMITH<<JOHN<<<<<<<<<<<<<<<<<<<<<<<<<<<<',
      '1234567897USA9001015M3001019<<<<<<<<<<<<<<<6',
    ];

    it('should parse valid TD3 MRZ', () => {
      const mrz = parseTD3(validTD3);
      
      expect(mrz.documentType).toBe('P');
      expect(mrz.issuingCountry).toBe('USA');
      expect(mrz.surname).toBe('SMITH');
      expect(mrz.givenNames).toBe('JOHN');
      expect(mrz.documentNumber).toBe('123456789');
      expect(mrz.nationality).toBe('USA');
      expect(mrz.sex).toBe('M');
    });

    it('should calculate full name', () => {
      const mrz = parseTD3(validTD3);
      expect(mrz.fullName).toBe('JOHN SMITH');
    });

    it('should calculate age correctly', () => {
      const mrz = parseTD3(validTD3);
      // Born 900101 = 1990-01-01
      // As of Dec 2025, should be 35
      expect(mrz.age).toBeGreaterThanOrEqual(34);
      expect(mrz.age).toBeLessThanOrEqual(36);
    });

    it('should detect expired documents', () => {
      const expiredMRZ = [
        'P<USASMITH<<JOHN<<<<<<<<<<<<<<<<<<<<<<<<<<<<',
        '1234567897USA9001015M2001019<<<<<<<<<<<<<<<6',
      ];
      const mrz = parseTD3(expiredMRZ);
      expect(mrz.isExpired).toBe(true);
    });
  });

  describe('TD1 Parsing (ID Card)', () => {
    const validTD1 = [
      'I<UTOD231458907<<<<<<<<<<<<<<<',
      '7408122F1204159UTO<<<<<<<<<<<6',
      'ERIKSSON<<ANNA<MARIA<<<<<<<<<<',
    ];

    it('should parse valid TD1 MRZ', () => {
      const mrz = parseTD1(validTD1);
      
      expect(mrz.documentType).toBe('I');
      expect(mrz.issuingCountry).toBe('UTO');
      expect(mrz.surname).toBe('ERIKSSON');
      expect(mrz.givenNames).toBe('ANNA MARIA');
    });
  });

  describe('Auto-Detection', () => {
    it('should auto-detect TD3 format', () => {
      const lines = [
        'P<USASMITH<<JOHN<<<<<<<<<<<<<<<<<<<<<<<<<<<<',
        '1234567897USA9001015M3001019<<<<<<<<<<<<<<<6',
      ];
      const mrz = parseMRZ(lines);
      expect(mrz.documentType).toBe('P');
    });

    it('should handle whitespace', () => {
      const lines = [
        '  P<USASMITH<<JOHN<<<<<<<<<<<<<<<<<<<<<<<<<<<< ',
        ' 1234567897USA9001015M3001019<<<<<<<<<<<<<<<6  ',
      ];
      const mrz = parseMRZ(lines);
      expect(mrz.surname).toBe('SMITH');
    });
  });

  describe('Validation', () => {
    it('should validate complete MRZ', () => {
      const mrz = parseTD3([
        'P<USASMITH<<JOHN<<<<<<<<<<<<<<<<<<<<<<<<<<<<',
        '1234567897USA9001015M3001019<<<<<<<<<<<<<<<6',
      ]);
      
      const result = validateMRZ(mrz);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing document number', () => {
      const mrz = {
        documentNumber: '',
        nationality: 'USA',
        dateOfBirth: '900101',
        expirationDate: '300101',
        sex: 'M' as const,
        age: 34,
      } as any;
      
      const result = validateMRZ(mrz);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing document number');
    });
  });

  describe('BAC Key Generation', () => {
    it('should generate BAC keys from MRZ', async () => {
      const mrz = parseTD3([
        'P<USASMITH<<JOHN<<<<<<<<<<<<<<<<<<<<<<<<<<<<',
        '1234567897USA9001015M3001019<<<<<<<<<<<<<<<6',
      ]);
      
      const keys = await generateBACKeys(mrz);
      
      expect(keys.kEnc).toHaveLength(16);
      expect(keys.kMac).toHaveLength(16);
      expect(keys.kEnc).not.toEqual(keys.kMac);
    });
  });

  describe('Country Codes', () => {
    it('should resolve common country codes', () => {
      expect(getCountryName('USA')).toBe('United States');
      expect(getCountryName('GBR')).toBe('United Kingdom');
      expect(getCountryName('DEU')).toBe('Germany');
    });

    it('should return code for unknown countries', () => {
      expect(getCountryName('XXX')).toBe('XXX');
    });
  });

  describe('Date Utilities', () => {
    it('should parse past dates correctly', () => {
      const date = parseMRZDate('900115', true);
      expect(date.getFullYear()).toBe(1990);
      expect(date.getMonth()).toBe(0); // January
      expect(date.getDate()).toBe(15);
    });

    it('should parse future dates correctly', () => {
      const date = parseMRZDate('350115', false);
      expect(date.getFullYear()).toBe(2035);
    });

    it('should calculate age accurately', () => {
      const birthDate = new Date(1990, 0, 15);
      const age = calculateAge(birthDate);
      
      const today = new Date();
      const expectedAge = today.getFullYear() - 1990 - 
        (today < new Date(today.getFullYear(), 0, 15) ? 1 : 0);
      
      expect(age).toBe(expectedAge);
    });

    it('should calculate days until expiry', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 100);
      
      const days = daysUntilExpiry(futureDate);
      expect(days).toBeGreaterThanOrEqual(99);
      expect(days).toBeLessThanOrEqual(101);
    });
  });
});
