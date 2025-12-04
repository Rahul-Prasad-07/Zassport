import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';

interface WalletConnectProps {
  onConnect: (address: string) => void;
}

export default function WalletConnect({ onConnect }: WalletConnectProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  const handleConnect = async () => {
    setIsConnecting(true);
    
    try {
      // Simulate wallet connection with mock address
      // In production, replace with actual Solana wallet adapter
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockAddress = '7vD2F4K8xN9Xt1BaM3Yp5Wc6Lh4Sg9Rj8Qe2Tn1Zu3V';
      setWalletAddress(mockAddress);
      onConnect(mockAddress);
      Alert.alert('Connected', 'Wallet connected successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to connect wallet. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setWalletAddress(null);
    Alert.alert('Disconnected', 'Wallet disconnected.');
  };

  return (
    <View style={styles.container}>
      {walletAddress ? (
        <View style={styles.connectedContainer}>
          <View style={styles.walletInfo}>
            <Text style={styles.connectedLabel}>Connected</Text>
            <Text style={styles.walletAddress}>
              {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
            </Text>
          </View>
          <TouchableOpacity style={styles.disconnectButton} onPress={handleDisconnect}>
            <Text style={styles.disconnectText}>Disconnect</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.connectButton, isConnecting && styles.connectingButton]}
          onPress={handleConnect}
          disabled={isConnecting}
        >
          <Text style={styles.walletIcon}>👛</Text>
          <Text style={styles.connectText}>
            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  connectButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  connectingButton: {
    backgroundColor: '#059669',
    opacity: 0.7,
  },
  walletIcon: {
    fontSize: 24,
  },
  connectText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  connectedContainer: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  walletInfo: {
    flex: 1,
  },
  connectedLabel: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  walletAddress: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'monospace',
  },
  disconnectButton: {
    backgroundColor: '#374151',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  disconnectText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
  },
});
