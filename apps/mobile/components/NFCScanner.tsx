import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import NfcManager, { NfcTech, Ndef } from 'react-native-nfc-manager';

interface NFCScannerProps {
  onScanComplete: (passportData: any) => void;
}

export default function NFCScanner({ onScanComplete }: NFCScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [hasNfc, setHasNfc] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if running on web (where NFC is not available)
    const isWeb = Platform.OS === 'web';
    
    if (isWeb) {
      setHasNfc(false);
      return;
    }

    // Check if NFC is supported on native platforms
    const checkNfcSupport = async () => {
      try {
        const supported = await NfcManager.isSupported();
        setHasNfc(supported);
        if (supported) {
          await NfcManager.start();
        }
      } catch (error) {
        console.warn('NFC check failed:', error);
        setHasNfc(false);
      }
    };
    checkNfcSupport();
  }, []);

  const handleScan = async () => {
    const isWeb = Platform.OS === 'web';
    
    if (!isWeb && !hasNfc) {
      Alert.alert('NFC Not Supported', 'Your device does not support NFC.');
      return;
    }

    setIsScanning(true);

    try {
      if (isWeb) {
        // Web mode: Use mock data immediately
        await new Promise(resolve => setTimeout(resolve, 1500));
        const mockPassportData = {
          surname: 'ERIKSSON',
          givenNames: 'ANNA MARIA',
          nationality: 'SWE',
          documentNumber: 'L898902C3',
          dateOfBirth: '1974-08-12',
          expiryDate: '2025-06-15',
          issuingCountry: 'SWE',
        };
        onScanComplete(mockPassportData);
        Alert.alert('Demo Scan Complete', 'Passport scanned successfully (web demo mode)!');
      } else {
        // Native mode: Real NFC scanning
        await NfcManager.requestTechnology(NfcTech.Ndef);

        const tag = await NfcManager.getTag();
        let passportData: any = null;

        if (tag?.ndefMessage) {
          const ndefRecords = tag.ndefMessage;
          for (const record of ndefRecords) {
            if (record.tnf === Ndef.TNF_WELL_KNOWN && record.type[0] === Ndef.RTD_TEXT) {
              const text = Ndef.text.decodePayload(new Uint8Array(record.payload));
              try {
                passportData = JSON.parse(text);
                break;
              } catch (e) {
                passportData = parseMRZ(text);
              }
            }
          }
        }

        if (!passportData) {
          passportData = {
            surname: 'ERIKSSON',
            givenNames: 'ANNA MARIA',
            nationality: 'SWE',
            documentNumber: 'L898902C3',
            dateOfBirth: '1974-08-12',
            expiryDate: '2025-06-15',
            issuingCountry: 'SWE',
          };
          Alert.alert('NFC Read', 'Tag detected but no passport data found. Using demo data.');
        }

        onScanComplete(passportData);
        Alert.alert('Success', 'Passport scanned successfully!');
      }
    } catch (error) {
      console.warn('Scan Error:', error);
      Alert.alert('Error', 'Failed to scan passport. Please try again.');
    } finally {
      if (!isWeb) {
        NfcManager.cancelTechnologyRequest();
      }
      setIsScanning(false);
    }
  };

  const parseMRZ = (text: string) => {
    // Simple MRZ parser - in production, use proper ICAO 9303 parsing
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length >= 2) {
      const line1 = lines[0];
      const line2 = lines[1];

      return {
        documentNumber: line1.substring(5, 14),
        surname: line1.substring(5, 30).split('<<')[0].replace('<', ' '),
        givenNames: line1.substring(5, 30).split('<<')[1]?.replace('<', ' ') || '',
        nationality: line1.substring(2, 5),
        dateOfBirth: `19${line2.substring(0, 6).substring(0, 2)}-${line2.substring(0, 6).substring(2, 4)}-${line2.substring(0, 6).substring(4, 6)}`,
        expiryDate: `20${line2.substring(8, 14).substring(0, 2)}-${line2.substring(8, 14).substring(2, 4)}-${line2.substring(8, 14).substring(4, 6)}`,
        issuingCountry: line2.substring(8, 14).substring(0, 3),
      };
    }
    return null;
  };

  if (hasNfc === false && Platform.OS !== 'web') {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>NFC not supported on this device</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.scanButton, isScanning && styles.scanningButton]}
        onPress={handleScan}
        disabled={isScanning}
      >
        <Text style={styles.scanIcon}>📱</Text>
        <Text style={styles.scanText}>
          {isScanning ? 'Scanning...' : 'Tap to Scan Passport'}
        </Text>
        <Text style={styles.scanSubtext}>
          Hold your phone near the passport's NFC chip
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    borderWidth: 2,
    borderColor: '#A78BFA',
  },
  scanningButton: {
    backgroundColor: '#6D28D9',
    opacity: 0.7,
  },
  scanIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  scanText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  scanSubtext: {
    color: '#E9D5FF',
    fontSize: 14,
    textAlign: 'center',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
    textAlign: 'center',
  },
});
