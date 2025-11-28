import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useState } from 'react';
import NFCScanner from '@/components/NFCScanner';
import WalletConnect from '@/components/WalletConnect';
import { generateAgeProof, generateNationalityProof, generatePassportProof } from '@/lib/zkProofs';

export default function HomeScreen() {
  const [passportData, setPassportData] = useState<any>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [proofs, setProofs] = useState<any[]>([]);
  const [generating, setGenerating] = useState(false);

  const handleScanComplete = (data: any) => {
    setPassportData(data);
  };

  const handleWalletConnect = (address: string) => {
    setWalletAddress(address);
  };

  const generateProofs = async () => {
    if (!passportData) return;

    setGenerating(true);
    try {
      const newProofs = [];

      // Generate age proof (18+)
      const ageProof = await generateAgeProof(passportData);
      newProofs.push({ type: 'Age Proof (18+)', proof: ageProof });

      // Generate nationality proof
      const nationalityProof = await generateNationalityProof(passportData, passportData.nationality);
      newProofs.push({ type: 'Nationality Proof', proof: nationalityProof });

      // Generate passport proof
      const passportProof = await generatePassportProof(passportData);
      newProofs.push({ type: 'Passport Verification', proof: passportProof });

      setProofs(newProofs);
      Alert.alert('Success', 'ZK proofs generated successfully!');
    } catch (error) {
      console.error('Error generating proofs:', error);
      Alert.alert('Error', 'Failed to generate proofs');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
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
            onPress={generateProofs}
            disabled={generating}
          >
            <Text style={styles.generateButtonText}>
              {generating ? 'Generating...' : 'Generate ZK Proofs'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {proofs.length > 0 && (
        <View style={styles.proofsSection}>
          <Text style={styles.proofsSectionTitle}>✅ ZK Proofs Generated</Text>
          {proofs.map((proof, index) => (
            <View key={index} style={styles.proofCard}>
              <Text style={styles.proofType}>{proof.type}</Text>
              <Text style={styles.proofStatus}>Verified</Text>
            </View>
          ))}
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  contentContainer: {
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
  proofsSection: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#374151',
  },
  proofsSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 15,
  },
  proofCard: {
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  proofType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  proofStatus: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },
});
