'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { WalletConnectButton } from "@/components/WalletConnectButton";

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen" style={{ background: '#0a0f14' }}>
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50" style={{ 
        background: 'rgba(10, 15, 20, 0.9)', 
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(148, 163, 184, 0.1)'
      }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <span className="text-xl font-semibold text-white">Zassport</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              <Link href="#features" className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-white/5">
                Features
              </Link>
              <Link href="#how-it-works" className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-white/5">
                How it Works
              </Link>
              <Link href="/claims" className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-white/5">
                Dashboard
              </Link>
            </div>

            {/* CTA */}
            <div className="hidden md:flex items-center gap-4">
              <WalletConnectButton />
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-400 hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden px-6 pb-4 space-y-2" style={{ background: 'rgba(10, 15, 20, 0.98)' }}>
            <Link href="#features" className="block px-4 py-3 text-slate-300 hover:text-white rounded-lg hover:bg-white/5" onClick={() => setMobileMenuOpen(false)}>
              Features
            </Link>
            <Link href="#how-it-works" className="block px-4 py-3 text-slate-300 hover:text-white rounded-lg hover:bg-white/5" onClick={() => setMobileMenuOpen(false)}>
              How it Works
            </Link>
            <Link href="/claims" className="block px-4 py-3 text-slate-300 hover:text-white rounded-lg hover:bg-white/5" onClick={() => setMobileMenuOpen(false)}>
              Dashboard
            </Link>
            <div className="pt-2">
              <WalletConnectButton />
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #10b981 0%, transparent 70%)', filter: 'blur(80px)' }} />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-15" style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)', filter: 'blur(80px)' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 flex justify-center">
          <div className="max-w-3xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#10b981' }} />
              <span className="text-sm font-medium" style={{ color: '#34d399' }}>Built on Solana • Zero Knowledge</span>
            </div>

            {/* Heading */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight tracking-tight">
              Identity Verification
              <br />
              <span style={{ background: 'linear-gradient(135deg, #34d399, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Without Exposure
              </span>
            </h1>

            {/* Subtitle */}
            <div className="w-full mx-auto text-center px-4">
               <div className="max-w-2xl mt-4 mb-10 mx-auto">
              <p className="mx-auto text-lg md:text-xl text-slate-400 mb-10 max-w-2xl leading-relaxed">
              Prove you&apos;re over 18, a citizen, or not sanctioned without revealing your passport data. 
              Privacy-preserving identity powered by zero-knowledge proofs.
              </p>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                href="/claims" 
                className="w-full sm:w-auto px-8 py-4 rounded-xl font-semibold transition-all hover:scale-105"
                style={{ 
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#ffffff',
                  boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)',
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'
                }}
              >
                Launch App
              </Link>
              <Link 
                href="#how-it-works" 
                className="w-full sm:w-auto px-8 py-4 rounded-xl font-semibold text-slate-300 transition-all hover:text-white"
                style={{ 
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(148, 163, 184, 0.2)'
                }}
              >
                Learn More
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-8 mt-16 pt-8" style={{ borderTop: '1px solid rgba(148, 163, 184, 0.1)' }}>
              <div className="flex items-center gap-2 text-slate-500">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">ICAO 9303 Compliant</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">Sub-second Verification</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 015.905-.75 1 1 0 001.937-.5A5.002 5.002 0 0010 2z" />
                </svg>
                <span className="text-sm">Zero Data Exposure</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24" style={{ background: '#0f1419' }}>
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Prove Without Revealing
            </h2>
            <div className="max-w-2xl mt-4 mx-auto">
            <p className="text-slate-400 text-lg flex mx-auto text-center px-4 leading-relaxed">
              Generate cryptographic proofs for common identity claims while keeping your personal data private
            </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Age Verification */}
            <div className="group p-6 rounded-2xl transition-all" style={{ 
              background: '#1a222d', 
              border: '1px solid rgba(148, 163, 184, 0.1)' 
            }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                <svg className="w-6 h-6" style={{ color: '#10b981' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="mb-2">
              <h3 className="text-lg font-semibold text-white mb-2">Age Verification</h3>
              </div>
              
              <p className="text-slate-400 text-sm leading-relaxed">
                Prove you&apos;re over 18, 21, or 65+ without revealing your actual birthdate
              </p>
            </div>

            {/* Nationality Proof */}
            <div className="group p-6 rounded-2xl transition-all" style={{ 
              background: '#1a222d', 
              border: '1px solid rgba(148, 163, 184, 0.1)' 
            }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
                <svg className="w-6 h-6" style={{ color: '#3b82f6' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
               <div className="mb-2">
              <h3 className="text-lg font-semibold text-white mb-2">Nationality Proof</h3>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                Prove citizenship of allowed countries without exposing passport details
              </p>
            </div>

            {/* Validity Check */}
            <div className="group p-6 rounded-2xl transition-all" style={{ 
              background: '#1a222d', 
              border: '1px solid rgba(148, 163, 184, 0.1)' 
            }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: 'rgba(168, 85, 247, 0.1)' }}>
                <svg className="w-6 h-6" style={{ color: '#a855f7' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
               <div className="mb-2">
              <h3 className="text-lg font-semibold text-white mb-2">Validity Check</h3>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                Prove your passport is not expired without revealing the expiry date
              </p>
            </div>

            {/* Sanctions Screening */}
            <div className="group p-6 rounded-2xl transition-all" style={{ 
              background: '#1a222d', 
              border: '1px solid rgba(148, 163, 184, 0.1)' 
            }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: 'rgba(245, 158, 11, 0.1)' }}>
                <svg className="w-6 h-6" style={{ color: '#f59e0b' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
               <div className="mb-2">
              <h3 className="text-lg font-semibold text-white mb-2">Sanctions Check</h3>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                Prove you&apos;re not from a sanctioned country for regulatory compliance
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24" style={{ background: '#0a0f14' }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              How It Works
            </h2>
            <div className="max-w-2xl mt-4 mb-10 mx-auto">
            <p className="text-slate-400 text-lg max-w-2xl mx-auto text-center px-4">
              Three simple steps to privacy-preserving identity verification
            </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="relative">
              <div className="text-6xl font-bold mb-6" style={{ color: 'rgba(16, 185, 129, 0.2)' }}>01</div>
              <h3 className="text-xl font-semibold text-white mb-3">Scan Your Passport</h3>
              <p className="text-slate-400 leading-relaxed">
                Use NFC to read your passport chip locally. Your data never leaves your device and is processed entirely client-side.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="text-6xl font-bold mb-6" style={{ color: 'rgba(59, 130, 246, 0.2)' }}>02</div>
              <h3 className="text-xl font-semibold text-white mb-3">Generate ZK Proof</h3>
              <p className="text-slate-400 leading-relaxed">
                Create cryptographic proofs that verify specific claims about your identity without revealing the underlying data.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="text-6xl font-bold mb-6" style={{ color: 'rgba(168, 85, 247, 0.2)' }}>03</div>
              <h3 className="text-xl font-semibold text-white mb-3">Submit On-Chain</h3>
              <p className="text-slate-400 leading-relaxed">
                Publish your proof to Solana. Verifiers can confirm your claims instantly without accessing any personal information.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Product Features */}
      <section className="py-24" style={{ background: '#0f1419' }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Production-Ready Features
            </h2>
            <div className="max-w-2xl mt-4 mb-10 mx-auto">
            <p className="text-slate-400 text-lg max-w-2xl mx-auto text-center px-4">
              Enterprise-grade capabilities for real-world deployment
            </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* NFC Scanning */}
            <Link href="/scan" className="group p-6 rounded-2xl transition-all hover:translate-y-[-4px]" style={{ 
              background: '#1a222d', 
              border: '1px solid rgba(148, 163, 184, 0.1)' 
            }}>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(16, 185, 129, 0.15)' }}>
                  <svg className="w-5 h-5" style={{ color: '#10b981' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white">NFC Passport Reader</h3>
              </div>
              <p className="text-slate-400 text-sm">ICAO 9303 compliant NFC reading with BAC/PACE authentication and SOD verification</p>
            </Link>

            {/* Cross-Chain */}
            <Link href="/bridge" className="group p-6 rounded-2xl transition-all hover:translate-y-[-4px]" style={{ 
              background: '#1a222d', 
              border: '1px solid rgba(148, 163, 184, 0.1)' 
            }}>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(59, 130, 246, 0.15)' }}>
                  <svg className="w-5 h-5" style={{ color: '#3b82f6' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white">Cross-Chain Bridge</h3>
              </div>
              <p className="text-slate-400 text-sm">Bridge attestations to Ethereum, Polygon, Arbitrum, and other chains via Wormhole</p>
            </Link>

            {/* Social Recovery */}
            <Link href="/recovery" className="group p-6 rounded-2xl transition-all hover:translate-y-[-4px]" style={{ 
              background: '#1a222d', 
              border: '1px solid rgba(148, 163, 184, 0.1)' 
            }}>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(168, 85, 247, 0.15)' }}>
                  <svg className="w-5 h-5" style={{ color: '#a855f7' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white">Social Recovery</h3>
              </div>
              <p className="text-slate-400 text-sm">Guardian-based 3-of-5 recovery with timelock protection and biometric authentication</p>
            </Link>

            {/* Biometrics */}
            <div className="p-6 rounded-2xl" style={{ 
              background: '#1a222d', 
              border: '1px solid rgba(148, 163, 184, 0.1)' 
            }}>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(236, 72, 153, 0.15)' }}>
                  <svg className="w-5 h-5" style={{ color: '#ec4899' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white">Biometric Auth</h3>
              </div>
              <p className="text-slate-400 text-sm">WebAuthn integration for Face ID, Touch ID, and Windows Hello authentication</p>
            </div>

            {/* Multi-Verifier */}
            <div className="p-6 rounded-2xl" style={{ 
              background: '#1a222d', 
              border: '1px solid rgba(148, 163, 184, 0.1)' 
            }}>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(245, 158, 11, 0.15)' }}>
                  <svg className="w-5 h-5" style={{ color: '#f59e0b' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white">Multi-Verifier Quorum</h3>
              </div>
              <p className="text-slate-400 text-sm">Decentralized 3-of-5 verification system with automatic revocation support</p>
            </div>

            {/* Governance */}
            <Link href="/governance" className="group p-6 rounded-2xl transition-all hover:translate-y-[-4px]" style={{ 
              background: '#1a222d', 
              border: '1px solid rgba(148, 163, 184, 0.1)' 
            }}>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(34, 211, 238, 0.15)' }}>
                  <svg className="w-5 h-5" style={{ color: '#22d3ee' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white">Governance</h3>
              </div>
              <p className="text-slate-400 text-sm">Privacy-preserving voting for protocol decisions and parameter updates</p>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20" style={{ background: '#0a0f14' }}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2" style={{ color: '#10b981' }}>150+</div>
              <div className="text-slate-500 text-sm">Countries Supported</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2" style={{ color: '#3b82f6' }}>&lt;1s</div>
              <div className="text-slate-500 text-sm">Verification Time</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2" style={{ color: '#a855f7' }}>6</div>
              <div className="text-slate-500 text-sm">Chains Supported</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2" style={{ color: '#f59e0b' }}>100%</div>
              <div className="text-slate-500 text-sm">Privacy Preserved</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24" style={{ background: '#0f1419' }}>
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <div className="max-w-xl mt-4 mb-10 mx-auto">
          <p className="text-slate-400 text-lg mb-10 max-w-2xl mx-auto text-center px-4">
            Connect your wallet and start generating privacy-preserving identity proofs in minutes.
          </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/claims" 
              className="w-full sm:w-auto px-8 py-4 rounded-xl font-semibold transition-all hover:scale-105"
              style={{ 
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#ffffff',
                boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'
              }}
            >
              Launch Dashboard
            </Link>
            <a 
              href="https://github.com/Rahul-Prasad-07/Zassport"
              target="_blank"
              rel="noopener noreferrer" 
              className="w-full sm:w-auto px-8 py-4 rounded-xl font-semibold text-slate-300 transition-all hover:text-white flex items-center justify-center gap-2"
              style={{ 
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(148, 163, 184, 0.2)'
              }}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
              View on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8" style={{ borderTop: '1px solid rgba(148, 163, 184, 0.1)', background: '#0a0f14' }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <span className="text-slate-500 text-sm">© 2025 Zassport. Privacy-preserving identity on Solana.</span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/claims" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">
                Dashboard
              </Link>
              <a href="https://github.com/Rahul-Prasad-07/Zassport" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">
                GitHub
              </a>
              <span className="text-slate-600 text-sm">Devnet</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
