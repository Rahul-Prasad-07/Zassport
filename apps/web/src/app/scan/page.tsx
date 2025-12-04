'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { NFCReaderUI, type PassportData } from '@/components/NFCReaderUI';

export default function ScanPassportPage() {
  const [passportData, setPassportData] = useState<PassportData | null>(null);
  const [verificationComplete, setVerificationComplete] = useState(false);

  const handleScanComplete = useCallback((data: PassportData) => {
    setPassportData(data);
    setVerificationComplete(true);
  }, []);

  const handleContinue = useCallback(() => {
    if (passportData) {
      // Normalize data for context compatibility
      const nameParts = passportData.fullName.split(' ');
      const normalizedData = {
        surname: nameParts[0] || '',
        givenNames: nameParts.slice(1).join(' ') || '',
        nationality: passportData.nationality,
        documentNumber: passportData.documentNumber,
        dateOfBirth: passportData.dateOfBirth,
        dateOfExpiry: passportData.expirationDate,
        expiryDate: passportData.expirationDate,
        issuingCountry: passportData.nationality, // Use nationality as fallback
        documentType: 'P',
        sex: passportData.sex || 'X',
      };
      
      sessionStorage.setItem('passportData', JSON.stringify(normalizedData));
      window.location.href = '/claims';
    }
  }, [passportData]);

  return (
    <div className="min-h-screen" style={{ background: '#0a0f14' }}>
      {/* Header */}
      <header className="sticky top-0 z-50" style={{ 
        background: 'rgba(10, 15, 20, 0.9)', 
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(148, 163, 184, 0.1)'
      }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <span className="text-lg font-semibold text-white">Zassport</span>
              </Link>
              <span className="text-slate-500">|</span>
              <span className="text-slate-400 text-sm">NFC Scanner</span>
            </div>
            <Link href="/claims" className="text-sm text-slate-400 hover:text-white transition-colors">
              Go to Dashboard →
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        {/* Page Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <svg className="w-4 h-4" style={{ color: '#10b981' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <span className="text-sm font-medium" style={{ color: '#34d399' }}>ICAO 9303 Compliant</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Scan Your Passport
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Use NFC to read your passport chip. Your data stays on your device and is used only to generate proofs.
          </p>
        </div>

        {/* Main Content */}
        {!verificationComplete ? (
          <div className="rounded-2xl p-8" style={{ background: '#1a222d', border: '1px solid rgba(148, 163, 184, 0.1)' }}>
            <NFCReaderUI onScanComplete={handleScanComplete} />
          </div>
        ) : (
          <div className="rounded-2xl p-8" style={{ background: '#1a222d', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(16, 185, 129, 0.15)' }}>
                <svg className="w-8 h-8" style={{ color: '#10b981' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-white mb-2">Passport Verified!</h2>
              <p className="text-slate-400 mb-8">
                Your passport has been cryptographically verified using the document&apos;s security object.
              </p>

              {passportData && (
                <div className="rounded-xl p-6 mb-8 text-left" style={{ background: '#0f1419' }}>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Name</p>
                      <p className="text-white font-medium">{passportData.fullName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Nationality</p>
                      <p className="text-white font-medium">{passportData.nationality}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Document Number</p>
                      <p className="text-white font-medium">{passportData.documentNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Expires</p>
                      <p className="text-white font-medium">
                        {new Date(passportData.expirationDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={handleContinue}
                className="w-full py-4 rounded-xl font-semibold text-white transition-all"
                style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
              >
                Continue to Generate Proofs
              </button>
            </div>
          </div>
        )}

        {/* How It Works */}
        <div className="mt-8 rounded-xl p-5" style={{ background: 'rgba(26, 34, 45, 0.5)', border: '1px solid rgba(148, 163, 184, 0.08)' }}>
          <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <svg className="w-4 h-4" style={{ color: '#3b82f6' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            How NFC Scanning Works
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 text-xs font-bold" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>1</div>
              <div>
                <h4 className="text-white font-medium text-sm mb-0.5">Connect Reader</h4>
                <p className="text-slate-400 text-xs">Plug in NFC reader</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 text-xs font-bold" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>2</div>
              <div>
                <h4 className="text-white font-medium text-sm mb-0.5">Place Passport</h4>
                <p className="text-slate-400 text-xs">Open to photo page</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 text-xs font-bold" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' }}>3</div>
              <div>
                <h4 className="text-white font-medium text-sm mb-0.5">Verify & Generate</h4>
                <p className="text-slate-400 text-xs">Create ZK proofs</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
