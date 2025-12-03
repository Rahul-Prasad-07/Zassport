'use client';

import React, { useState, useEffect } from 'react';
import {
  isWebAuthnSupported,
  isPlatformAuthenticatorAvailable,
  getStoredCredentials,
  registerBiometric,
  authenticateWithBiometric,
  removeCredential,
  BiometricCredential,
} from '@/lib/webauthn';

interface BiometricGateProps {
  onAuthenticated?: () => void;
  onAuthSuccess?: (userId: string) => void;
  onCancel?: () => void;
  title?: string;
  description?: string;
  requireAuth?: boolean;
}

export function BiometricGate({
  onAuthenticated,
  onAuthSuccess,
  onCancel,
  title = 'Biometric Authentication Required',
  description = 'Authenticate with Face ID, Touch ID, or your device biometrics to access this content.',
  requireAuth = false,
}: BiometricGateProps) {
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const [hasPlatformAuth, setHasPlatformAuth] = useState<boolean | null>(null);
  const [credentials, setCredentials] = useState<BiometricCredential[]>([]);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSetup, setShowSetup] = useState(false);

  useEffect(() => {
    checkSupport();
    loadCredentials();
  }, []);

  async function checkSupport() {
    const supported = isWebAuthnSupported();
    setIsSupported(supported);
    
    if (supported) {
      const platformAvailable = await isPlatformAuthenticatorAvailable();
      setHasPlatformAuth(platformAvailable);
    }
  }

  function loadCredentials() {
    setCredentials(getStoredCredentials());
  }

  async function handleRegister() {
    setIsRegistering(true);
    setError(null);
    
    try {
      // Generate a unique user ID
      const userId = `zassport-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      
      const result = await registerBiometric(
        'Zassport User',
        'ZK Identity',
        userId
      );
      
      if (result.success && result.credential) {
        loadCredentials();
        setShowSetup(false);
      } else {
        setError(result.error || 'Registration failed');
      }
    } catch (e: any) {
      setError(e.message || 'Registration failed');
    } finally {
      setIsRegistering(false);
    }
  }

  async function handleAuthenticate() {
    setIsAuthenticating(true);
    setError(null);
    
    try {
      const result = await authenticateWithBiometric();
      
      if (result.success) {
        onAuthenticated?.();
        onAuthSuccess?.(result.credentialId || 'authenticated');
      } else {
        setError(result.error || 'Authentication failed');
      }
    } catch (e: any) {
      setError(e.message || 'Authentication failed');
    } finally {
      setIsAuthenticating(false);
    }
  }

  function handleRemoveCredential(credentialId: string) {
    if (confirm('Are you sure you want to remove this biometric credential?')) {
      removeCredential(credentialId);
      loadCredentials();
    }
  }

  // Loading state
  if (isSupported === null) {
    return (
      <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-2xl p-8 text-center">
        <div className="animate-pulse">
          <div className="w-16 h-16 mx-auto bg-purple-500/30 rounded-full mb-4"></div>
          <div className="h-4 bg-purple-500/30 rounded w-3/4 mx-auto"></div>
        </div>
      </div>
    );
  }

  // Not supported
  if (!isSupported) {
    return (
      <div className="bg-gradient-to-br from-red-900/50 via-slate-900 to-red-900/50 rounded-2xl p-8">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-red-300 mb-2">Biometrics Not Supported</h3>
          <p className="text-gray-400">
            Your browser doesn't support WebAuthn biometric authentication.
            Please use a modern browser like Chrome, Safari, Firefox, or Edge.
          </p>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="mt-6 w-full py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    );
  }

  // Setup mode (no credentials)
  if (credentials.length === 0 || showSetup) {
    return (
      <div className="bg-gradient-to-br from-blue-900/50 via-slate-900 to-purple-900/50 rounded-2xl p-8">
        <div className="text-center mb-8">
          {/* Fingerprint Icon */}
          <div className="w-20 h-20 mx-auto mb-4 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full opacity-20 animate-pulse"></div>
            <div className="absolute inset-2 bg-gradient-to-br from-blue-600 to-purple-700 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.864 4.243A7.5 7.5 0 0119.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 004.5 10.5a7.464 7.464 0 01-1.15 3.993m1.989 3.559A11.209 11.209 0 008.25 10.5a3.75 3.75 0 117.5 0c0 .527-.021 1.049-.064 1.565M12 10.5a14.94 14.94 0 01-3.6 9.75m6.633-4.596a18.666 18.666 0 01-2.485 5.33" />
              </svg>
            </div>
          </div>
          
          <h3 className="text-2xl font-bold text-white mb-2">Set Up Biometric Protection</h3>
          <p className="text-gray-400 max-w-md mx-auto">
            Protect your ZK credentials with {hasPlatformAuth ? 'your device\'s built-in biometrics' : 'a security key'}.
            This adds an extra layer of security to your identity.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-800/50 rounded-xl p-4 text-center">
            <div className="w-10 h-10 mx-auto mb-2 bg-green-500/20 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <p className="text-sm text-gray-300">Secure</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4 text-center">
            <div className="w-10 h-10 mx-auto mb-2 bg-blue-500/20 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <p className="text-sm text-gray-300">Fast</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4 text-center">
            <div className="w-10 h-10 mx-auto mb-2 bg-purple-500/20 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <p className="text-sm text-gray-300">Private</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleRegister}
          disabled={isRegistering}
          className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:transform-none flex items-center justify-center gap-2"
        >
          {isRegistering ? (
            <>
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Registering...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.864 4.243A7.5 7.5 0 0119.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 004.5 10.5a7.464 7.464 0 01-1.15 3.993m1.989 3.559A11.209 11.209 0 008.25 10.5a3.75 3.75 0 117.5 0c0 .527-.021 1.049-.064 1.565M12 10.5a14.94 14.94 0 01-3.6 9.75m6.633-4.596a18.666 18.666 0 01-2.485 5.33" />
              </svg>
              Register Biometric
            </>
          )}
        </button>

        {(onCancel || credentials.length > 0) && (
          <button
            onClick={() => credentials.length > 0 ? setShowSetup(false) : onCancel?.()}
            className="mt-4 w-full py-3 bg-slate-700/50 hover:bg-slate-700 text-gray-300 rounded-xl transition-colors"
          >
            {credentials.length > 0 ? 'Back to Authentication' : 'Cancel'}
          </button>
        )}
      </div>
    );
  }

  // Authentication mode
  return (
    <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-2xl p-8">
      <div className="text-center mb-8">
        {/* Animated Fingerprint */}
        <div className="w-24 h-24 mx-auto mb-6 relative">
          <div className={`absolute inset-0 bg-gradient-to-br from-green-400 to-blue-500 rounded-full ${isAuthenticating ? 'animate-pulse' : 'opacity-20'}`}></div>
          <div className="absolute inset-3 bg-slate-900 rounded-full flex items-center justify-center">
            <svg className={`w-12 h-12 ${isAuthenticating ? 'text-green-400' : 'text-blue-400'} transition-colors`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.864 4.243A7.5 7.5 0 0119.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 004.5 10.5a7.464 7.464 0 01-1.15 3.993m1.989 3.559A11.209 11.209 0 008.25 10.5a3.75 3.75 0 117.5 0c0 .527-.021 1.049-.064 1.565M12 10.5a14.94 14.94 0 01-3.6 9.75m6.633-4.596a18.666 18.666 0 01-2.485 5.33" />
            </svg>
          </div>
          {isAuthenticating && (
            <div className="absolute inset-0 border-4 border-green-400/30 rounded-full animate-ping"></div>
          )}
        </div>
        
        <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
        <p className="text-gray-400 max-w-md mx-auto">{description}</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Registered Credentials */}
      <div className="mb-6 space-y-3">
        <p className="text-sm text-gray-400 mb-2">Available credentials:</p>
        {credentials.map((cred) => (
          <div key={cred.credentialId} className="flex items-center justify-between bg-slate-800/50 rounded-lg p-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-white text-sm font-medium">{cred.deviceName}</p>
                <p className="text-gray-500 text-xs">
                  Last used: {new Date(cred.lastUsed).toLocaleDateString()}
                </p>
              </div>
            </div>
            <button
              onClick={() => handleRemoveCredential(cred.credentialId)}
              className="text-gray-500 hover:text-red-400 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={handleAuthenticate}
        disabled={isAuthenticating}
        className="w-full py-4 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-500 hover:to-blue-500 text-white font-semibold rounded-xl transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:transform-none flex items-center justify-center gap-2"
      >
        {isAuthenticating ? (
          <>
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Verifying...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Authenticate
          </>
        )}
      </button>

      <div className="mt-4 flex gap-3">
        <button
          onClick={() => setShowSetup(true)}
          className="flex-1 py-3 bg-slate-700/50 hover:bg-slate-700 text-gray-300 rounded-xl transition-colors text-sm"
        >
          Add New Device
        </button>
        {onCancel && (
          <button
            onClick={onCancel}
            className="flex-1 py-3 bg-slate-700/50 hover:bg-slate-700 text-gray-300 rounded-xl transition-colors text-sm"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

// Named export for convenience
export default BiometricGate;
