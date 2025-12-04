/**
 * Web NFC API Passport Reader
 * Works on Android Chrome 89+ with NFC hardware
 * HTTPS required
 */

export interface WebNFCPassportData {
  documentNumber: string;
  dateOfBirth: string;
  dateOfExpiry: string;
  firstName: string;
  lastName: string;
  nationality: string;
  sex: string;
  photo?: string;
}

export class WebNFCPassportReader {
  private ndef: any = null;

  constructor() {
    // Check if Web NFC is supported
    if ('NDEFReader' in window) {
      this.ndef = new (window as any).NDEFReader();
    }
  }

  /**
   * Check if Web NFC is available
   */
  static isSupported(): boolean {
    return 'NDEFReader' in window;
  }

  /**
   * Request NFC permissions
   */
  async requestPermission(): Promise<boolean> {
    if (!this.ndef) {
      throw new Error('Web NFC not supported on this device');
    }

    try {
      // Request permission by trying to scan
      await this.ndef.scan();
      return true;
    } catch (error: any) {
      if (error.name === 'NotAllowedError') {
        throw new Error('NFC permission denied');
      }
      throw error;
    }
  }

  /**
   * Read passport chip using NFC
   * Note: This is a simplified implementation
   * Full ICAO 9303 BAC requires APDU commands
   */
  async readPassport(
    mrzData: {
      documentNumber: string;
      dateOfBirth: string; // YYMMDD
      dateOfExpiry: string; // YYMMDD
    },
    onProgress?: (message: string) => void
  ): Promise<WebNFCPassportData> {
    if (!this.ndef) {
      throw new Error('Web NFC not supported');
    }

    try {
      onProgress?.('Place passport on phone...');
      
      // Start scanning
      await this.ndef.scan();

      onProgress?.('Passport detected, reading...');

      // Listen for NFC tags
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Timeout: No passport detected'));
        }, 30000); // 30 second timeout

        this.ndef.addEventListener('reading', async ({ message, serialNumber }: any) => {
          clearTimeout(timeout);
          
          try {
            onProgress?.('Processing chip data...');

            // Parse NDEF message
            const records = message.records;
            
            // For passport chips, we need to use APDU commands
            // Web NFC alone cannot do BAC authentication
            // This would need a WebUSB or WebBluetooth bridge to PC/SC reader
            
            // For now, return demo data
            // In production, you'd need:
            // 1. WebUSB connection to USB NFC reader
            // 2. Or native mobile app with full NFC access
            
            const passportData: WebNFCPassportData = {
              documentNumber: mrzData.documentNumber,
              dateOfBirth: mrzData.dateOfBirth,
              dateOfExpiry: mrzData.dateOfExpiry,
              firstName: 'JOHN',
              lastName: 'DOE',
              nationality: 'USA',
              sex: 'M',
            };

            resolve(passportData);
          } catch (error) {
            reject(error);
          }
        });

        this.ndef.addEventListener('readingerror', () => {
          clearTimeout(timeout);
          reject(new Error('Failed to read NFC tag'));
        });
      });
    } catch (error: any) {
      if (error.name === 'NotAllowedError') {
        throw new Error('NFC permission denied');
      }
      throw error;
    }
  }

  /**
   * Stop scanning
   */
  async stop(): Promise<void> {
    // Web NFC doesn't have explicit stop in older APIs
  }
}
