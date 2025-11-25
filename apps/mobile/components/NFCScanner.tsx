import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';

interface NFCScannerProps {
  onScanComplete: (passportData: any) => void;
}

export default function NFCScanner({ onScanComplete }: NFCScannerProps) {
  const [isScanning, setIsScanning] = useState(false);

  const handleScan = async () => {
    setIsScanning(true);
    
    try {
      // Simulate NFC scan with mock data for now
      // In production, replace with actual react-native-nfc-manager implementation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
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
      Alert.alert('Success', 'Passport scanned successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to scan passport. Please try again.');
    } finally {
      setIsScanning(false);
    }
  };

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
});
