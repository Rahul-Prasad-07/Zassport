import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useState } from 'react';
import NFCScanner from '@/components/NFCScanner';
import WalletConnect from '@/components/WalletConnect';

export default function HomeScreen() {
  const [passportData, setPassportData] = useState<any>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  const handleScanComplete = (data: any) => {
    setPassportData(data);
  };

  const handleWalletConnect = (address: string) => {
    setWalletAddress(address);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🛂 Zassport</Text>
        <Text style={styles.subtitle}>Privacy-Preserving Identity</Text>
      </View>

      <WalletConnect onConnect={handleWalletConnect} />

      <View style={styles.scanSection}>
        <Text style={styles.sectionTitle}>Scan Your Passport</Text>
        <Text style={styles.description}>
          Place your phone on the passport chip to read encrypted data.
          All processing happens on your device.
        </Text>

        <NFCScanner onScanComplete={handleScanComplete} />
      </View>

      {passportData && (
        <View style={styles.dataSection}>
          <Text style={styles.dataSectionTitle}>✅ Passport Data Retrieved</Text>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Document Number:</Text>
            <Text style={styles.dataValue}>{passportData.documentNumber}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Name:</Text>
            <Text style={styles.dataValue}>
              {passportData.givenNames} {passportData.surname}
            </Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Nationality:</Text>
            <Text style={styles.dataValue}>{passportData.nationality}</Text>
          </View>
          <TouchableOpacity
            style={styles.generateButton}
            onPress={() => Alert.alert('Coming Soon', 'ZK proof generation')}
          >
            <Text style={styles.generateButtonText}>Generate ZK Proofs</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.features}>
        <View style={styles.feature}>
          <Text style={styles.featureIcon}>🔐</Text>
          <Text style={styles.featureText}>Private</Text>
        </View>
        <View style={styles.feature}>
          <Text style={styles.featureIcon}>⚡</Text>
          <Text style={styles.featureText}>Fast</Text>
        </View>
        <View style={styles.feature}>
          <Text style={styles.featureIcon}>🛡️</Text>
          <Text style={styles.featureText}>Secure</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  scanSection: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#374151',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 20,
    lineHeight: 20,
  },
  scanButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  scanButtonDisabled: {
    backgroundColor: '#6B7280',
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  dataSection: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  dataSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 15,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  dataLabel: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  dataValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  generateButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 15,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  features: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  feature: {
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 32,
    marginBottom: 5,
  },
  featureText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});
