/**
 * MRZ OCR Post-Processing Utilities
 * Corrects common OCR mistakes in Machine Readable Zone text
 */

// Common OCR character confusions in MRZ
const CHAR_CORRECTIONS: Record<string, Record<string, string>> = {
  // In document number positions (alphanumeric expected)
  alphanumeric: {
    'O': '0', // O often misread as 0 and vice versa
    'o': '0',
    'D': '0', // D can look like 0
    'Q': '0',
    'I': '1', // I often misread as 1
    'l': '1', // lowercase L as 1
    '|': '1',
    'Z': '2', // Z can look like 2
    'S': '5', // S can look like 5
    'G': '6', // G can look like 6
    'B': '8', // B can look like 8
    '$': 'S',
    '!': '1',
    '@': 'A',
    '#': 'H',
  },
  // In numeric-only positions (dates, check digits)
  numeric: {
    'O': '0',
    'o': '0',
    'D': '0',
    'I': '1',
    'l': '1',
    '|': '1',
    'i': '1',
    'Z': '2',
    'z': '2',
    'E': '3',
    'A': '4',
    'S': '5',
    's': '5',
    'G': '6',
    'b': '6',
    'T': '7',
    'B': '8',
    'g': '9',
    'q': '9',
  },
  // In alpha-only positions (names, country codes)
  alpha: {
    '0': 'O',
    '1': 'I',
    '2': 'Z',
    '3': 'E',
    '4': 'A',
    '5': 'S',
    '6': 'G',
    '7': 'T',
    '8': 'B',
    '9': 'G',
    '@': 'A',
    '$': 'S',
    '!': 'I',
  },
};

// Valid MRZ characters
const VALID_MRZ_CHARS = new Set('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<');

/**
 * Clean and normalize a single MRZ line
 */
export function cleanMRZLine(line: string): string {
  return line
    .toUpperCase()
    .replace(/\s+/g, '') // Remove all whitespace
    .replace(/[^A-Z0-9<]/g, '<') // Replace invalid chars with filler
    .trim();
}

/**
 * Correct OCR mistakes in MRZ based on expected field types
 */
export function correctMRZCharacters(line: string, lineNumber: number, totalLines: number): string {
  const chars = line.split('');
  
  // TD3 (Passport): 2 lines of 44 characters
  if (totalLines === 2) {
    if (lineNumber === 0) {
      // Line 1: P<ISSUER<<NAMES<<<<<
      // Position 0-1: Document type (alpha)
      // Position 2-4: Issuing country (alpha)
      // Position 5-43: Names (alpha + <)
      for (let i = 0; i < chars.length; i++) {
        if (i <= 4 || i > 4) {
          // All of line 1 should be alpha + <
          chars[i] = correctChar(chars[i], 'alpha');
        }
      }
    } else {
      // Line 2: DOC#######<NATIONALITY<DOB<<<SEX<EXPIRY<<<<<<
      // Position 0-8: Document number (alphanumeric)
      // Position 9: Check digit (numeric)
      // Position 10-12: Nationality (alpha)
      // Position 13-18: Date of birth (numeric)
      // Position 19: Check digit (numeric)
      // Position 20: Sex (alpha: M/F/X)
      // Position 21-26: Expiry date (numeric)
      // Position 27: Check digit (numeric)
      // Position 28-42: Optional data (alphanumeric)
      // Position 43: Composite check (numeric)
      
      for (let i = 0; i < chars.length; i++) {
        if (i <= 8) {
          // Document number: alphanumeric
          chars[i] = correctChar(chars[i], 'alphanumeric');
        } else if (i === 9 || i === 19 || i === 27 || i === 43) {
          // Check digits: numeric
          chars[i] = correctChar(chars[i], 'numeric');
        } else if ((i >= 10 && i <= 12) || i === 20) {
          // Nationality & Sex: alpha
          chars[i] = correctChar(chars[i], 'alpha');
        } else if ((i >= 13 && i <= 18) || (i >= 21 && i <= 26)) {
          // Dates: numeric
          chars[i] = correctChar(chars[i], 'numeric');
        } else {
          // Optional data: alphanumeric
          chars[i] = correctChar(chars[i], 'alphanumeric');
        }
      }
    }
  }
  
  return chars.join('');
}

/**
 * Correct a single character based on expected type
 */
function correctChar(char: string, expectedType: 'alpha' | 'numeric' | 'alphanumeric'): string {
  if (char === '<') return char;
  
  const corrections = CHAR_CORRECTIONS[expectedType];
  if (corrections && corrections[char]) {
    return corrections[char];
  }
  
  // If character is invalid for expected type, try to fix it
  if (expectedType === 'numeric' && !/[0-9]/.test(char)) {
    return corrections?.[char] || '0';
  }
  if (expectedType === 'alpha' && !/[A-Z]/.test(char)) {
    return corrections?.[char] || '<';
  }
  
  return char;
}

/**
 * Find the best MRZ lines from OCR text
 */
export function extractMRZLines(ocrText: string): string[] {
  // Split into lines and clean
  const allLines = ocrText
    .split(/[\n\r]+/)
    .map(line => cleanMRZLine(line))
    .filter(line => line.length >= 28); // Minimum MRZ line length
  
  console.log('🔍 [MRZ-OCR] All potential lines:', allLines);
  
  // Try to find TD3 format (passport: 2 lines of 44 chars)
  const td3Lines = findTD3Lines(allLines);
  if (td3Lines) {
    console.log('✅ [MRZ-OCR] Found TD3 format');
    return td3Lines;
  }
  
  // Try to find TD1 format (ID card: 3 lines of 30 chars)
  const td1Lines = findTD1Lines(allLines);
  if (td1Lines) {
    console.log('✅ [MRZ-OCR] Found TD1 format');
    return td1Lines;
  }
  
  // Try to find TD2 format (2 lines of 36 chars)
  const td2Lines = findTD2Lines(allLines);
  if (td2Lines) {
    console.log('✅ [MRZ-OCR] Found TD2 format');
    return td2Lines;
  }
  
  // Fallback: return best 2 lines
  console.log('⚠️ [MRZ-OCR] No standard format found, using best guess');
  return allLines.slice(0, 2);
}

/**
 * Find TD3 (Passport) MRZ lines
 */
function findTD3Lines(lines: string[]): string[] | null {
  // Look for 2 consecutive lines that could be TD3
  for (let i = 0; i < lines.length - 1; i++) {
    const line1 = lines[i];
    const line2 = lines[i + 1];
    
    // TD3 lines should be 44 chars or close
    if (line1.length >= 40 && line2.length >= 40) {
      // Line 1 should start with document type (P, V, etc.)
      if (/^[PVIAC]/.test(line1)) {
        // Pad to 44 if needed
        const padded1 = line1.padEnd(44, '<').substring(0, 44);
        const padded2 = line2.padEnd(44, '<').substring(0, 44);
        
        // Apply character corrections
        return [
          correctMRZCharacters(padded1, 0, 2),
          correctMRZCharacters(padded2, 1, 2),
        ];
      }
    }
  }
  return null;
}

/**
 * Find TD1 (ID Card) MRZ lines
 */
function findTD1Lines(lines: string[]): string[] | null {
  // Look for 3 consecutive lines around 30 chars
  for (let i = 0; i < lines.length - 2; i++) {
    const line1 = lines[i];
    const line2 = lines[i + 1];
    const line3 = lines[i + 2];
    
    if (line1.length >= 28 && line1.length <= 32 &&
        line2.length >= 28 && line2.length <= 32 &&
        line3.length >= 28 && line3.length <= 32) {
      if (/^[IVIAC]/.test(line1)) {
        return [
          line1.padEnd(30, '<').substring(0, 30),
          line2.padEnd(30, '<').substring(0, 30),
          line3.padEnd(30, '<').substring(0, 30),
        ];
      }
    }
  }
  return null;
}

/**
 * Find TD2 MRZ lines
 */
function findTD2Lines(lines: string[]): string[] | null {
  for (let i = 0; i < lines.length - 1; i++) {
    const line1 = lines[i];
    const line2 = lines[i + 1];
    
    if (line1.length >= 34 && line1.length <= 38 &&
        line2.length >= 34 && line2.length <= 38) {
      if (/^[PVIAC]/.test(line1)) {
        return [
          line1.padEnd(36, '<').substring(0, 36),
          line2.padEnd(36, '<').substring(0, 36),
        ];
      }
    }
  }
  return null;
}

/**
 * Validate MRZ check digits
 */
export function validateMRZChecksums(line2: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // TD3 Line 2 check digit positions
  const docNumber = line2.substring(0, 9);
  const docCheck = line2[9];
  const dob = line2.substring(13, 19);
  const dobCheck = line2[19];
  const expiry = line2.substring(21, 27);
  const expiryCheck = line2[27];
  
  if (!verifyCheckDigit(docNumber, docCheck)) {
    errors.push(`Document number check digit mismatch (got ${docCheck}, expected ${calculateCheckDigit(docNumber)})`);
  }
  
  if (!verifyCheckDigit(dob, dobCheck)) {
    errors.push(`Date of birth check digit mismatch (got ${dobCheck}, expected ${calculateCheckDigit(dob)})`);
  }
  
  if (!verifyCheckDigit(expiry, expiryCheck)) {
    errors.push(`Expiry date check digit mismatch (got ${expiryCheck}, expected ${calculateCheckDigit(expiry)})`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

// MRZ check digit weights
const WEIGHTS = [7, 3, 1];

// Character values for check digit calculation
const CHAR_VALUES: Record<string, number> = {
  '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
  '<': 0,
  'A': 10, 'B': 11, 'C': 12, 'D': 13, 'E': 14, 'F': 15, 'G': 16, 'H': 17, 'I': 18, 'J': 19,
  'K': 20, 'L': 21, 'M': 22, 'N': 23, 'O': 24, 'P': 25, 'Q': 26, 'R': 27, 'S': 28, 'T': 29,
  'U': 30, 'V': 31, 'W': 32, 'X': 33, 'Y': 34, 'Z': 35,
};

function calculateCheckDigit(value: string): string {
  let sum = 0;
  for (let i = 0; i < value.length; i++) {
    const char = value[i].toUpperCase();
    const val = CHAR_VALUES[char] ?? 0;
    sum += val * WEIGHTS[i % 3];
  }
  return (sum % 10).toString();
}

function verifyCheckDigit(value: string, checkDigit: string): boolean {
  return calculateCheckDigit(value) === checkDigit;
}

/**
 * Try to auto-correct MRZ based on check digit validation
 */
export function autoCorrectMRZ(line2: string): string {
  let corrected = line2;
  
  // Try to fix document number
  const docNumber = corrected.substring(0, 9);
  const docCheck = corrected[9];
  
  if (!verifyCheckDigit(docNumber, docCheck)) {
    // Try common corrections
    const correctedDoc = tryCorrections(docNumber, docCheck);
    if (correctedDoc) {
      corrected = correctedDoc + corrected.substring(9);
    }
  }
  
  // Try to fix DOB
  const dob = corrected.substring(13, 19);
  const dobCheck = corrected[19];
  
  if (!verifyCheckDigit(dob, dobCheck)) {
    const correctedDob = tryNumericCorrections(dob, dobCheck);
    if (correctedDob) {
      corrected = corrected.substring(0, 13) + correctedDob + corrected.substring(19);
    }
  }
  
  // Try to fix expiry
  const expiry = corrected.substring(21, 27);
  const expiryCheck = corrected[27];
  
  if (!verifyCheckDigit(expiry, expiryCheck)) {
    const correctedExpiry = tryNumericCorrections(expiry, expiryCheck);
    if (correctedExpiry) {
      corrected = corrected.substring(0, 21) + correctedExpiry + corrected.substring(27);
    }
  }
  
  return corrected;
}

function tryCorrections(value: string, expectedCheck: string): string | null {
  const corrections: Record<string, string[]> = {
    'O': ['0'], '0': ['O', 'D', 'Q'],
    'I': ['1'], '1': ['I', 'L'],
    'Z': ['2'], '2': ['Z'],
    'S': ['5'], '5': ['S'],
    'B': ['8'], '8': ['B'],
    'G': ['6'], '6': ['G'],
  };
  
  // Try single character corrections
  for (let i = 0; i < value.length; i++) {
    const char = value[i];
    const possibleCorrections = corrections[char];
    
    if (possibleCorrections) {
      for (const correction of possibleCorrections) {
        const newValue = value.substring(0, i) + correction + value.substring(i + 1);
        if (calculateCheckDigit(newValue) === expectedCheck) {
          return newValue;
        }
      }
    }
  }
  
  return null;
}

function tryNumericCorrections(value: string, expectedCheck: string): string | null {
  const corrections: Record<string, string[]> = {
    'O': ['0'], 'D': ['0'], 'Q': ['0'],
    'I': ['1'], 'L': ['1'], '|': ['1'],
    'Z': ['2'],
    'S': ['5'],
    'G': ['6'],
    'B': ['8'],
  };
  
  for (let i = 0; i < value.length; i++) {
    const char = value[i];
    const possibleCorrections = corrections[char];
    
    if (possibleCorrections) {
      for (const correction of possibleCorrections) {
        const newValue = value.substring(0, i) + correction + value.substring(i + 1);
        if (calculateCheckDigit(newValue) === expectedCheck) {
          return newValue;
        }
      }
    }
  }
  
  return null;
}
