'use client';

import React, { useState } from 'react';
import { MRZData } from '@/lib/nfc/types';
import { parseMRZ, validateMRZ } from '@/lib/nfc/icao9303';

interface ManualPassportEntryProps {
  onSubmit: (data: MRZData) => void;
  onCancel: () => void;
  initialData?: Partial<MRZData>;
}

// Example MRZ for reference
const EXAMPLE_MRZ = `P<USASMITH<<JOHN<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
1234567897USA9001015M3001019<<<<<<<<<<<<<<<6`;

export function ManualPassportEntry({ onSubmit, onCancel }: ManualPassportEntryProps) {
  const [mrzInput, setMrzInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<MRZData | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleParse = () => {
    setError(null);
    setParsedData(null);

    if (!mrzInput.trim()) {
      setError('Please enter the MRZ lines from your passport');
      return;
    }

    try {
      // Split into lines and clean
      const lines = mrzInput
        .trim()
        .split('\n')
        .map(line => line.trim().toUpperCase().replace(/\s/g, ''))
        .filter(line => line.length > 0);

      console.log('📋 [ManualEntry] Parsed lines:', lines);

      if (lines.length < 2) {
        setError('Please enter both MRZ lines (2 lines for passport, 3 for ID card)');
        return;
      }

      // Validate line lengths
      const line1Length = lines[0].length;
      const line2Length = lines[1].length;

      if (line1Length < 30 || line2Length < 30) {
        setError(`MRZ lines seem too short. Line 1: ${line1Length} chars, Line 2: ${line2Length} chars. Expected 44 chars each for passports.`);
        return;
      }

      // Parse MRZ
      const mrzData = parseMRZ(lines);
      
      // Validate parsed data
      const validation = validateMRZ(mrzData);
      if (!validation.valid) {
        console.warn('⚠️ [ManualEntry] Validation warnings:', validation.errors);
      }

      console.log('✅ [ManualEntry] MRZ parsed successfully:', mrzData);
      setParsedData(mrzData);
      setShowPreview(true);

    } catch (err: any) {
      console.error('❌ [ManualEntry] Parse error:', err);
      setError(err.message || 'Failed to parse MRZ. Please check the format and try again.');
    }
  };

  const handleConfirm = () => {
    if (parsedData) {
      onSubmit(parsedData);
    }
  };

  const loadExample = () => {
    setMrzInput(EXAMPLE_MRZ);
    setError(null);
    setParsedData(null);
    setShowPreview(false);
  };

  const handleEdit = () => {
    setShowPreview(false);
    setParsedData(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl border border-slate-700/50 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
          <div>
            <h2 className="text-xl font-bold text-white">Enter MRZ Manually</h2>
            <p className="text-sm text-slate-400 mt-1">
              {showPreview ? 'Verify your passport details' : 'Enter the 2 lines from the bottom of your passport'}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-700/50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {!showPreview ? (
            /* MRZ Input View */
            <div className="space-y-4">
              {/* MRZ Example Image */}
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium text-slate-300">Where to find the MRZ</span>
                </div>
                <p className="text-xs text-slate-400 mb-3">
                  Look at the bottom of your passport's data page. You'll see 2 lines of text with letters, numbers, and {"<"} symbols.
                </p>
                <div className="bg-slate-900 rounded-lg p-3 font-mono text-xs text-emerald-400 overflow-x-auto">
                  <div>P&lt;USASMITH&lt;&lt;JOHN&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</div>
                  <div>1234567897USA9001015M3001019&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;6</div>
                </div>
              </div>

              {/* MRZ Input */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-slate-300">
                    Machine Readable Zone (MRZ)
                  </label>
                  <button
                    onClick={loadExample}
                    className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    Load Example
                  </button>
                </div>
                <textarea
                  value={mrzInput}
                  onChange={(e) => {
                    setMrzInput(e.target.value.toUpperCase());
                    setError(null);
                  }}
                  placeholder={`P<USASMITH<<JOHN<<<<<<<<<<<<<<<<<<<<<<<<<<<<<\n1234567897USA9001015M3001019<<<<<<<<<<<<<<<6`}
                  className="w-full h-28 bg-slate-800/50 border border-slate-600 rounded-lg p-3 text-white font-mono text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                  spellCheck={false}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="characters"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Enter exactly as shown on your passport - include all {"<"} symbols
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-red-300">{error}</p>
                  </div>
                </div>
              )}

              {/* Privacy Notice */}
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <p className="text-xs text-emerald-300">
                    Your data stays on your device. Only zero-knowledge proofs are shared with the blockchain.
                  </p>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onCancel}
                  className="flex-1 px-4 py-3 bg-slate-700/50 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleParse}
                  disabled={!mrzInput.trim()}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-500 hover:to-teal-500 transition-all font-semibold shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Parse MRZ
                </button>
              </div>
            </div>
          ) : (
            /* Preview View */
            <div className="space-y-4">
              {parsedData && (
                <>
                  {/* Verification Badge */}
                  <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500/20 text-emerald-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium">MRZ Parsed Successfully</span>
                  </div>

                  {/* Passport Data */}
                  <div className="bg-slate-800/50 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-3 pb-3 border-b border-slate-700">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center text-white font-bold">
                        {parsedData.givenNames?.charAt(0) || '?'}{parsedData.surname?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="text-white font-semibold">{parsedData.fullName || 'Unknown'}</p>
                        <p className="text-sm text-slate-400">{parsedData.nationality}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-slate-500">Document Number</p>
                        <p className="text-white font-mono font-medium">{parsedData.documentNumber}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Nationality</p>
                        <p className="text-white font-medium">{parsedData.nationality}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Date of Birth</p>
                        <p className="text-white font-medium">{parsedData.dateOfBirth} ({parsedData.age} years)</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Sex</p>
                        <p className="text-white font-medium">
                          {parsedData.sex === 'M' ? 'Male' : parsedData.sex === 'F' ? 'Female' : 'Other'}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500">Expiration Date</p>
                        <p className={`font-medium ${parsedData.isExpired ? 'text-red-400' : 'text-emerald-400'}`}>
                          {parsedData.expirationDate} {parsedData.isExpired ? '(Expired)' : `(${parsedData.daysUntilExpiry} days)`}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500">Issuing Country</p>
                        <p className="text-white font-medium">{parsedData.issuingCountry}</p>
                      </div>
                    </div>
                  </div>

                  {/* Confirmation */}
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                    <div className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <p className="text-xs text-amber-300">
                        Please verify this information matches your passport exactly before proceeding.
                      </p>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleEdit}
                      className="flex-1 px-4 py-3 bg-slate-700/50 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors font-medium"
                    >
                      Edit MRZ
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirm}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-500 hover:to-teal-500 transition-all font-semibold shadow-lg shadow-emerald-500/25"
                    >
                      Confirm & Continue
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ManualPassportEntry;
