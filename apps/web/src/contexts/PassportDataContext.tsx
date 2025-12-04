'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

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
}

const PassportDataContext = createContext<PassportDataContextType | undefined>(undefined);

export function PassportDataProvider({ children }: { children: React.ReactNode }) {
  const [passportData, setPassportDataState] = useState<PassportData | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);

  // Load data from sessionStorage on mount (for scan → registration flow)
  useEffect(() => {
    const stored = sessionStorage.getItem('passportData');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        console.log('Loaded passport data from sessionStorage:', parsed);
        setPassportDataState(parsed);
      } catch (e) {
        console.error('Failed to parse passport data from sessionStorage:', e);
      }
    }
  }, []);

  const setPassportData = useCallback((data: PassportData | null) => {
    setPassportDataState(data);
    // Don't persist to sessionStorage here - it's already done by scan page
  }, []);

  const clearPassportData = useCallback(() => {
    setPassportDataState(null);
    setIsRegistered(false);
    sessionStorage.removeItem('passportData');
    console.log('Cleared passport data');
  }, []);

  return (
    <PassportDataContext.Provider
      value={{
        passportData,
        setPassportData,
        clearPassportData,
        isRegistered,
        setIsRegistered,
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
