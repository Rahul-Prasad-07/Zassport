'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { 
  storeEncryptedPassport, 
  loadEncryptedPassport, 
  hasStoredPassport, 
  clearStoredPassport,
  getSignatureMessage 
} from '@/lib/storage';

export interface PassportData {
  surname: string;
  givenNames: string;
  nationality: string;
  documentNumber: string;
  dateOfBirth: string; // YYMMDD format
  dateOfExpiry: string; // YYMMDD format (matches passportParser)
  expiryDate?: string; // Alias for backward compatibility
  issuingCountry: string;
  issuingState?: string; // Alias for passportParser
  documentType?: string; // For passportParser compatibility
  sex?: string;
  personalNumber?: string;
}

interface PassportDataContextType {
  passportData: PassportData | null;
  setPassportData: (data: PassportData | null) => void;
  clearPassportData: () => void;
  isRegistered: boolean;
  setIsRegistered: (registered: boolean) => void;
  // New encrypted storage methods
  hasStoredData: boolean;
  isLoadingStored: boolean;
  loadStoredPassport: () => Promise<boolean>;
  savePassportToStorage: () => Promise<boolean>;
  clearStoredData: () => void;
}

const PassportDataContext = createContext<PassportDataContextType | undefined>(undefined);

export function PassportDataProvider({ children }: { children: React.ReactNode }) {
  const { publicKey, signMessage } = useWallet();
  const [passportData, setPassportDataState] = useState<PassportData | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [lastWallet, setLastWallet] = useState<string | null>(null);
  const [hasStoredData, setHasStoredData] = useState(false);
  const [isLoadingStored, setIsLoadingStored] = useState(false);

  // Check for stored data when wallet changes
  useEffect(() => {
    const currentWallet = publicKey?.toString() || null;
    
    if (currentWallet !== lastWallet) {
      console.log('🔄 Wallet changed:', { from: lastWallet, to: currentWallet });
      // Clear registration state and passport data for new wallet
      setIsRegistered(false);
      setPassportDataState(null);
      setLastWallet(currentWallet);
      
      // Check if there's stored data for this wallet
      if (currentWallet) {
        const stored = hasStoredPassport(currentWallet);
        setHasStoredData(stored);
        console.log('📦 [Context] Stored passport data exists:', stored);
      } else {
        setHasStoredData(false);
      }
    }
  }, [publicKey, lastWallet]);

  // Also load from sessionStorage for backward compatibility (scan flow)
  useEffect(() => {
    const stored = sessionStorage.getItem('passportData');
    if (stored && !passportData) {
      try {
        const parsed = JSON.parse(stored);
        console.log('📋 [Context] Loaded passport data from sessionStorage:', parsed);
        setPassportDataState(parsed);
      } catch (e) {
        console.error('Failed to parse passport data from sessionStorage:', e);
      }
    }
  }, []);

  // Load stored encrypted passport data
  const loadStoredPassport = useCallback(async (): Promise<boolean> => {
    if (!publicKey || !signMessage) {
      console.log('❌ [Context] Cannot load: wallet not connected or signMessage not available');
      return false;
    }

    const walletAddress = publicKey.toString();
    if (!hasStoredPassport(walletAddress)) {
      console.log('📭 [Context] No stored passport data for this wallet');
      return false;
    }

    setIsLoadingStored(true);
    try {
      console.log('🔓 [Context] Requesting signature to decrypt passport data...');
      const data = await loadEncryptedPassport(walletAddress, signMessage);
      
      if (data) {
        setPassportDataState(data);
        // Also save to sessionStorage for component compatibility
        sessionStorage.setItem('passportData', JSON.stringify(data));
        console.log('✅ [Context] Loaded encrypted passport data');
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ [Context] Failed to load stored passport:', error);
      return false;
    } finally {
      setIsLoadingStored(false);
    }
  }, [publicKey, signMessage]);

  // Save current passport data to encrypted storage
  const savePassportToStorage = useCallback(async (): Promise<boolean> => {
    if (!publicKey || !signMessage || !passportData) {
      console.log('❌ [Context] Cannot save: missing wallet, signMessage, or passport data');
      return false;
    }

    try {
      console.log('🔐 [Context] Requesting signature to encrypt passport data...');
      const success = await storeEncryptedPassport(
        passportData,
        publicKey.toString(),
        signMessage
      );
      
      if (success) {
        setHasStoredData(true);
      }
      return success;
    } catch (error) {
      console.error('❌ [Context] Failed to save passport to storage:', error);
      return false;
    }
  }, [publicKey, signMessage, passportData]);

  // Clear stored encrypted data
  const clearStoredData = useCallback(() => {
    if (publicKey) {
      clearStoredPassport(publicKey.toString());
      setHasStoredData(false);
    }
  }, [publicKey]);

  const setPassportData = useCallback((data: PassportData | null) => {
    setPassportDataState(data);
    if (data) {
      // Also save to sessionStorage for backward compatibility
      sessionStorage.setItem('passportData', JSON.stringify(data));
    }
  }, []);

  const clearPassportData = useCallback(() => {
    setPassportDataState(null);
    setIsRegistered(false);
    sessionStorage.removeItem('passportData');
    console.log('Cleared passport data from memory');
  }, []);

  return (
    <PassportDataContext.Provider
      value={{
        passportData,
        setPassportData,
        clearPassportData,
        isRegistered,
        setIsRegistered,
        hasStoredData,
        isLoadingStored,
        loadStoredPassport,
        savePassportToStorage,
        clearStoredData,
      }}
    >
      {children}
    </PassportDataContext.Provider>
  );
}

export function usePassportData() {
  const context = useContext(PassportDataContext);
  if (context === undefined) {
    throw new Error('usePassportData must be used within a PassportDataProvider');
  }
  return context;
}
