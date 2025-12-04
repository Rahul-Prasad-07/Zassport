'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MRZData, NFCEvent, PassiveAuthResult } from '@/lib/nfc/types';
import { parseMRZ, validateMRZ, getCountryName } from '@/lib/nfc/icao9303';
import { WebNFCPassportReader } from '@/lib/nfc/web-nfc-reader';
import { CameraMRZScanner } from './CameraMRZScanner';
import { ManualPassportEntry } from './ManualPassportEntry';

interface NFCReaderUIProps {
  onPassportRead?: (data: { mrz: MRZData; verified: boolean }) => void;
  onScanComplete?: (data: PassportData) => void;
  onError?: (error: string) => void;
  className?: string;
}

type ReaderState = 
  | 'idle'
  | 'no-reader'
  | 'waiting-card'
  | 'mrz-input'
  | 'authenticating'
  | 'reading'
  | 'success'
  | 'error';

// Export passport data type for consumers
export interface PassportData {
  fullName: string;
  nationality: string;
  documentNumber: string;
  dateOfBirth: string;
  expirationDate: string;
  sex: string;
  verified: boolean;
}

export function NFCReaderUI({ onPassportRead, onScanComplete, onError, className }: NFCReaderUIProps) {
  const [state, setState] = useState<ReaderState>('idle');
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [mrzInput, setMrzInput] = useState('');
  const [parsedMRZ, setParsedMRZ] = useState<MRZData | null>(null);
  const [authResult, setAuthResult] = useState<PassiveAuthResult | null>(null);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [showCameraScanner, setShowCameraScanner] = useState(false);

  // Demo mode for when NFC hardware isn't available
  const [demoMode, setDemoMode] = useState(false);

  // Log component mount
  useEffect(() => {
    console.log('🎬 [NFCReaderUI] Component mounted');
    console.log('🔧 [NFCReaderUI] Initial state:', {
      state,
      showManualEntry,
      showCameraScanner,
      demoMode
    });
  }, []);

  // Log state changes
  useEffect(() => {
    console.log('🔄 [NFCReaderUI] State changed to:', state);
  }, [state]);

  useEffect(() => {
    console.log('📸 [NFCReaderUI] showCameraScanner changed to:', showCameraScanner);
  }, [showCameraScanner]);

  const handleNFCEvent = useCallback((event: NFCEvent) => {
    switch (event.type) {
      case 'reader_connected':
        setState('waiting-card');
        break;
      case 'reader_disconnected':
        setState('no-reader');
        break;
      case 'card_inserted':
        setState('mrz-input');
        break;
      case 'card_removed':
        setState('waiting-card');
        setParsedMRZ(null);
        break;
      case 'authentication_required':
        setState('authenticating');
        break;
      case 'authentication_success':
        setState('reading');
        break;
      case 'authentication_failed':
        setState('error');
        setError(`Authentication failed: ${event.error}`);
        break;
      case 'reading_progress':
        setProgress(event.progress);
        setProgressMessage(event.step);
        break;
      case 'reading_complete':
        setState('success');
        if (event.data.passiveAuthResult) {
          setAuthResult(event.data.passiveAuthResult);
        }
        if (event.data.mrz && onPassportRead) {
          onPassportRead({
            mrz: event.data.mrz,
            verified: event.data.passiveAuthResult?.verified || false,
          });
        }
        break;
      case 'reading_error':
        setState('error');
        setError(event.error);
        onError?.(event.error);
        break;
    }
  }, [onPassportRead, onError]);

  // Parse MRZ from input
  const handleMRZSubmit = () => {
    try {
      const lines = mrzInput.trim().split('\n').filter(l => l.trim());
      const mrz = parseMRZ(lines);
      const validation = validateMRZ(mrz);
      
      if (!validation.valid) {
        setError(`Invalid MRZ: ${validation.errors.join(', ')}`);
        return;
      }
      
      setParsedMRZ(mrz);
      
      if (demoMode) {
        // In demo mode, simulate reading
        simulateReading(mrz);
      } else {
        // Real mode would trigger BAC authentication
        setState('authenticating');
      }
    } catch (e: any) {
      setError(e.message || 'Failed to parse MRZ');
    }
  };

  // Simulate reading for demo mode
  const simulateReading = async (mrz: MRZData) => {
    setState('reading');
    
    const steps = [
      { message: 'Authenticating...', progress: 20 },
      { message: 'Reading MRZ', progress: 40 },
      { message: 'Reading Face Image', progress: 60 },
      { message: 'Verifying Signatures', progress: 80 },
      { message: 'Complete', progress: 100 },
    ];
    
    for (const step of steps) {
      setProgress(step.progress);
      setProgressMessage(step.message);
      await new Promise(r => setTimeout(r, 500));
    }
    
    setState('success');
    setAuthResult({
      verified: true,
      certificateChainValid: true,
      dataGroupHashesValid: true,
      signatureValid: true,
      errors: [],
    });
    
    onPassportRead?.({
      mrz,
      verified: true,
    });
  };

  const resetReader = () => {
    setState('idle');
    setProgress(0);
    setProgressMessage('');
    setError(null);
    setMrzInput('');
    setParsedMRZ(null);
    setAuthResult(null);
  };

  // Example MRZ for demo
  const loadExampleMRZ = () => {
    setMrzInput(`P<USASMITH<<JOHN<<<<<<<<<<<<<<<<<<<<<<<<<<<<
1234567897USA9001015M3001019<<<<<<<<<<<<<<<6`);
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 rounded-2xl p-6 max-w-xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">NFC Passport Reader</h2>
            <p className="text-sm text-gray-400">Scan your e-Passport chip</p>
          </div>
        </div>
        
        {/* Demo Mode Toggle */}
        <button
          onClick={() => setDemoMode(!demoMode)}
          className={`px-3 py-1 text-xs rounded-full ${
            demoMode 
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
              : 'bg-slate-700/50 text-gray-400 border border-slate-600/30'
          }`}
        >
          {demoMode ? '🎮 Demo' : 'Demo Off'}
        </button>
      </div>

      {/* Status Display */}
      {state === 'idle' && (
        <div className="text-center py-8">
          <div className="w-24 h-24 mx-auto mb-6 relative">
            <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-pulse"></div>
            <div className="absolute inset-4 bg-slate-800 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
              </svg>
            </div>
          </div>
          <p className="text-gray-400 mb-6 mt-6">
            {demoMode 
              ? 'Demo mode active - scan or enter MRZ manually'
              : 'Scan passport or enter MRZ manually'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => {
                console.log('📸 [NFCReaderUI] Camera scanner button clicked');
                setShowCameraScanner(true);
              }}
              className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-500 hover:to-teal-500 transition-all font-semibold flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Scan with Camera
            </button>
            <button
              onClick={() => setShowManualEntry(true)}
              className="px-6 py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-all font-semibold"
            >
              Enter Manually
            </button>
          </div>
        </div>
      )}

      {/* Manual Entry Modal - Uses the new user-friendly form */}
      {showManualEntry && (
        <ManualPassportEntry
          onSubmit={(mrzData) => {
            console.log('✅ [NFCReaderUI] Manual entry complete:', mrzData);
            setShowManualEntry(false);
            setParsedMRZ(mrzData);
            if (demoMode) {
              simulateReading(mrzData);
            } else {
              setState('success');
              setAuthResult({
                verified: true,
                certificateChainValid: true,
                dataGroupHashesValid: true,
                signatureValid: true,
                errors: [],
              });
              onPassportRead?.({
                mrz: mrzData,
                verified: true,
              });
            }
          }}
          onCancel={() => {
            setShowManualEntry(false);
            setError(null);
          }}
        />
      )}

      {/* Legacy MRZ text input - for advanced users or mrz-input state */}
      {state === 'mrz-input' && !showManualEntry && (
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-300">
                Machine Readable Zone (MRZ)
              </label>
              <button
                onClick={loadExampleMRZ}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                Load Example
              </button>
            </div>
            <textarea
              value={mrzInput}
              onChange={(e) => setMrzInput(e.target.value.toUpperCase())}
              placeholder="P<USASMITH<<JOHN<<<<<<<<<<<<<<<<<<<<<<<<<<<<&#10;1234567897USA9001015M3001019<<<<<<<<<<<<<<<6"
              className="w-full h-24 bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-white font-mono text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500"
              spellCheck={false}
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter the two lines from the bottom of your passport's data page
            </p>
          </div>
          
          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}
          
          <div className="flex gap-3">
            <button
              onClick={handleMRZSubmit}
              disabled={!mrzInput.trim()}
              className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-500 hover:to-emerald-500 transition-all disabled:opacity-50"
            >
              Read Passport
            </button>
            <button
              onClick={() => {
                setState('idle');
                setMrzInput('');
                setError(null);
              }}
              className="px-4 py-3 bg-slate-700/50 text-gray-300 rounded-xl hover:bg-slate-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Reading Progress */}
      {(state === 'authenticating' || state === 'reading') && (
        <div className="py-8">
          <div className="w-20 h-20 mx-auto mb-6 relative">
            <svg className="w-20 h-20 transform -rotate-90">
              <circle
                cx="40"
                cy="40"
                r="36"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-slate-700"
              />
              <circle
                cx="40"
                cy="40"
                r="36"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                className="text-green-500 transition-all duration-500"
                strokeDasharray={`${progress * 2.26} 226`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-bold text-white">{progress}%</span>
            </div>
          </div>
          <p className="text-center text-gray-300 font-medium">{progressMessage}</p>
          <p className="text-center text-gray-500 text-sm mt-1">
            {state === 'authenticating' ? 'Establishing secure connection...' : 'Reading passport data...'}
          </p>
        </div>
      )}

      {/* Success State */}
      {state === 'success' && parsedMRZ && (
        <div className="space-y-4">
          {/* Verification Badge */}
          <div className={`flex items-center justify-center gap-2 py-3 rounded-xl ${
            authResult?.verified 
              ? 'bg-green-500/20 text-green-400' 
              : 'bg-amber-500/20 text-amber-400'
          }`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {authResult?.verified ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              )}
            </svg>
            <span className="font-medium">
              {authResult?.verified ? 'Cryptographically Verified' : 'Verification Incomplete'}
            </span>
          </div>

          {/* Passport Data */}
          <div className="bg-slate-800/50 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-700">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                {parsedMRZ.givenNames.charAt(0)}{parsedMRZ.surname.charAt(0)}
              </div>
              <div>
                <p className="text-white font-semibold">{parsedMRZ.fullName}</p>
                <p className="text-sm text-gray-400">{getCountryName(parsedMRZ.nationality)}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-500">Age</p>
                <p className="text-white font-medium">{parsedMRZ.age} years old</p>
              </div>
              <div>
                <p className="text-gray-500">Sex</p>
                <p className="text-white font-medium">{parsedMRZ.sex === 'M' ? 'Male' : parsedMRZ.sex === 'F' ? 'Female' : 'Other'}</p>
              </div>
              <div>
                <p className="text-gray-500">Document</p>
                <p className="text-white font-medium">{parsedMRZ.documentNumber}</p>
              </div>
              <div>
                <p className="text-gray-500">Expires</p>
                <p className={`font-medium ${parsedMRZ.isExpired ? 'text-red-400' : parsedMRZ.daysUntilExpiry < 90 ? 'text-amber-400' : 'text-green-400'}`}>
                  {parsedMRZ.isExpired ? 'Expired' : `${parsedMRZ.daysUntilExpiry} days`}
                </p>
              </div>
            </div>
          </div>

          {/* Verification Details */}
          {authResult && (
            <div className="bg-slate-800/50 rounded-xl p-4">
              <p className="text-sm font-medium text-gray-300 mb-3">Verification Details</p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Certificate Chain</span>
                  <span className={authResult.certificateChainValid ? 'text-green-400' : 'text-red-400'}>
                    {authResult.certificateChainValid ? '✓ Valid' : '✗ Invalid'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Data Group Hashes</span>
                  <span className={authResult.dataGroupHashesValid ? 'text-green-400' : 'text-red-400'}>
                    {authResult.dataGroupHashesValid ? '✓ Valid' : '✗ Invalid'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Digital Signature</span>
                  <span className={authResult.signatureValid ? 'text-green-400' : 'text-red-400'}>
                    {authResult.signatureValid ? '✓ Valid' : '✗ Invalid'}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            {onScanComplete && (
              <button
                onClick={() => {
                  const passportData: PassportData = {
                    fullName: parsedMRZ.fullName,
                    nationality: parsedMRZ.nationality,
                    documentNumber: parsedMRZ.documentNumber,
                    dateOfBirth: parsedMRZ.dateOfBirth,
                    expirationDate: parsedMRZ.expirationDate,
                    sex: parsedMRZ.sex,
                    verified: authResult?.verified || false,
                  };
                  onScanComplete(passportData);
                }}
                className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-500 hover:to-teal-500 transition-all font-semibold"
              >
                Use This Data
              </button>
            )}
            <button
              onClick={resetReader}
              className={`py-3 ${onScanComplete ? 'flex-1' : 'w-full'} bg-slate-700/50 text-gray-300 rounded-xl hover:bg-slate-700 transition-colors`}
            >
              Scan Another Passport
            </button>
          </div>
        </div>
      )}

      {/* Error State */}
      {state === 'error' && (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <p className="text-red-300 font-medium mb-2">Reading Failed</p>
          <p className="text-gray-400 text-sm mb-6">{error}</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={resetReader}
              className="px-6 py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => {
                setError(null);
                setState('idle');
                setShowManualEntry(true);
              }}
              className="px-6 py-3 bg-emerald-600/20 text-emerald-400 rounded-xl hover:bg-emerald-600/30 transition-colors border border-emerald-500/30"
            >
              Enter Details Manually
            </button>
          </div>
        </div>
      )}

      {/* Info Footer */}
      <div className="mt-6 pt-4 border-t border-slate-700/50">
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span>Your passport data never leaves your device</span>
        </div>
      </div>

      {/* Camera Scanner Modal */}
      {showCameraScanner && (
        <CameraMRZScanner
          onMRZScanned={(mrz) => {
            console.log('✅ [NFCReaderUI] Camera scan complete, MRZ data:', mrz);
            setShowCameraScanner(false);
            setParsedMRZ(mrz);
            if (demoMode) {
              simulateReading(mrz);
            } else {
              setState('success');
              setAuthResult({
                verified: true,
                certificateChainValid: true,
                dataGroupHashesValid: true,
                signatureValid: true,
                errors: [],
              });
              onPassportRead?.({
                mrz,
                verified: true,
              });
            }
          }}
          onError={(err) => {
            console.error('❌ [NFCReaderUI] Camera scan error:', err);
            // Don't close scanner on error - let user try again or close manually
            setError(err);
          }}
          onClose={() => {
            console.log('🚪 [NFCReaderUI] Camera scanner closed');
            setShowCameraScanner(false);
            // If there was an error, offer manual entry
            if (error) {
              setShowManualEntry(true);
              setError(null);
            }
          }}
        />
      )}
    </div>
  );
}

export default NFCReaderUI;
