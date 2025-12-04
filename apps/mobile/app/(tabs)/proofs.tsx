import { View, Text, StyleSheet, FlatList } from 'react-native';

const mockProofs = [
  {
    id: '1',
    type: 'Age Proof',
    timestamp: '2025-11-25 10:30',
    status: 'Verified',
  },
  {
    id: '2',
    type: 'Nationality Proof',
    timestamp: '2025-11-25 10:32',
    status: 'Verified',
  },
];

export default function ProofsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your ZK Proofs</Text>
      <FlatList
        data={mockProofs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.proofCard}>
            <View style={styles.proofHeader}>
              <Text style={styles.proofType}>{item.type}</Text>
              <Text style={styles.proofStatus}>✅ {item.status}</Text>
            </View>
            <Text style={styles.proofTime}>{item.timestamp}</Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No proofs generated yet</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  proofCard: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#374151',
  },
  proofHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  proofType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  proofStatus: {
    fontSize: 14,
    color: '#10B981',
  },
  proofTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 40,
  },
});
