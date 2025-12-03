/**
 * WebAuthn Biometric Authentication Service
 * Provides fingerprint/face authentication for securing ZK claims
 * Uses the Web Authentication API (WebAuthn) for strong user verification
 */

// Types for WebAuthn
export interface BiometricCredential {
  credentialId: string;
  publicKey: string;
  algorithm: number;
  transports: string[];
  createdAt: Date;
  lastUsed: Date;
  deviceName: string;
}

export interface BiometricAuthResult {
  success: boolean;
  credentialId?: string;
  signature?: string;
  authenticatorData?: string;
  clientDataJSON?: string;
  error?: string;
}

export interface BiometricRegistrationResult {
  success: boolean;
  credential?: BiometricCredential;
  error?: string;
}

// Generate a random challenge
function generateChallenge(): Uint8Array {
  const challenge = new Uint8Array(32);
  crypto.getRandomValues(challenge);
  return challenge;
}

// Convert ArrayBuffer to base64url
function bufferToBase64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let str = '';
  for (const byte of bytes) {
    str += String.fromCharCode(byte);
  }
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Convert base64url to ArrayBuffer
function base64urlToBuffer(base64url: string): ArrayBuffer {
  const base64 = base64url
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const padding = '='.repeat((4 - base64.length % 4) % 4);
  const binary = atob(base64 + padding);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Check if WebAuthn is supported
 */
export function isWebAuthnSupported(): boolean {
  return !!(
    window.PublicKeyCredential &&
    typeof window.PublicKeyCredential === 'function'
  );
}

/**
 * Check if platform authenticator is available (built-in biometrics)
 */
export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  if (!isWebAuthnSupported()) return false;
  
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch (e) {
    console.error('Error checking platform authenticator:', e);
    return false;
  }
}

/**
 * Get stored credentials from localStorage
 */
export function getStoredCredentials(): BiometricCredential[] {
  try {
    const stored = localStorage.getItem('zassport_biometric_credentials');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Error loading credentials:', e);
  }
  return [];
}

/**
 * Save credentials to localStorage
 */
function saveCredentials(credentials: BiometricCredential[]): void {
  localStorage.setItem('zassport_biometric_credentials', JSON.stringify(credentials));
}

/**
 * Register a new biometric credential
 */
export async function registerBiometric(
  userName: string,
  userDisplayName: string,
  userId: string
): Promise<BiometricRegistrationResult> {
  if (!isWebAuthnSupported()) {
    return { success: false, error: 'WebAuthn is not supported in this browser' };
  }
  
  try {
    const challengeBytes = generateChallenge();
    const challenge = challengeBytes.buffer.slice(challengeBytes.byteOffset, challengeBytes.byteOffset + challengeBytes.byteLength) as ArrayBuffer;
    
    // Relying party info (your app)
    const rpId = window.location.hostname;
    const rpName = 'Zassport - ZK Passport Identity';
    
    // User info
    const userIdArray = new TextEncoder().encode(userId);
    const userIdBytes = userIdArray.buffer.slice(userIdArray.byteOffset, userIdArray.byteOffset + userIdArray.byteLength) as ArrayBuffer;
    
    // Create credential options
    const createOptions: PublicKeyCredentialCreationOptions = {
      challenge,
      rp: {
        name: rpName,
        id: rpId,
      },
      user: {
        id: userIdBytes,
        name: userName,
        displayName: userDisplayName,
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' },   // ES256 (P-256)
        { alg: -257, type: 'public-key' }, // RS256
        { alg: -8, type: 'public-key' },   // EdDSA
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform', // Use platform authenticator (Touch ID, Face ID, Windows Hello)
        userVerification: 'required',        // Require biometric verification
        residentKey: 'preferred',           // Prefer discoverable credentials
      },
      timeout: 60000, // 60 seconds
      attestation: 'none', // We don't need attestation for our use case
    };
    
    // Create credential
    const credential = await navigator.credentials.create({
      publicKey: createOptions,
    }) as PublicKeyCredential;
    
    if (!credential) {
      return { success: false, error: 'Failed to create credential' };
    }
    
    const response = credential.response as AuthenticatorAttestationResponse;
    
    // Extract public key from attestation
    const publicKeyBytes = response.getPublicKey();
    if (!publicKeyBytes) {
      return { success: false, error: 'Failed to get public key' };
    }
    
    // Create credential object
    const newCredential: BiometricCredential = {
      credentialId: bufferToBase64url(credential.rawId),
      publicKey: bufferToBase64url(publicKeyBytes),
      algorithm: response.getPublicKeyAlgorithm(),
      transports: response.getTransports?.() || [],
      createdAt: new Date(),
      lastUsed: new Date(),
      deviceName: getDeviceName(),
    };
    
    // Save to storage
    const credentials = getStoredCredentials();
    credentials.push(newCredential);
    saveCredentials(credentials);
    
    return { success: true, credential: newCredential };
    
  } catch (error: any) {
    if (error.name === 'NotAllowedError') {
      return { success: false, error: 'User cancelled the registration' };
    }
    if (error.name === 'InvalidStateError') {
      return { success: false, error: 'A credential already exists for this user' };
    }
    return { success: false, error: error.message || 'Registration failed' };
  }
}

/**
 * Authenticate with biometrics
 */
export async function authenticateWithBiometric(
  credentialId?: string
): Promise<BiometricAuthResult> {
  if (!isWebAuthnSupported()) {
    return { success: false, error: 'WebAuthn is not supported in this browser' };
  }
  
  try {
    const challengeBytes = generateChallenge();
    const challenge = challengeBytes.buffer.slice(challengeBytes.byteOffset, challengeBytes.byteOffset + challengeBytes.byteLength) as ArrayBuffer;
    const credentials = getStoredCredentials();
    
    if (credentials.length === 0) {
      return { success: false, error: 'No biometric credentials registered' };
    }
    
    // Build allowed credentials list
    let allowCredentials: PublicKeyCredentialDescriptor[] | undefined;
    
    if (credentialId) {
      // Authenticate with specific credential
      allowCredentials = [{
        type: 'public-key',
        id: base64urlToBuffer(credentialId),
      }];
    } else {
      // Allow any registered credential
      allowCredentials = credentials.map(cred => ({
        type: 'public-key' as const,
        id: base64urlToBuffer(cred.credentialId),
        transports: cred.transports as AuthenticatorTransport[],
      }));
    }
    
    const getOptions: PublicKeyCredentialRequestOptions = {
      challenge,
      rpId: window.location.hostname,
      allowCredentials,
      userVerification: 'required',
      timeout: 60000,
    };
    
    const assertion = await navigator.credentials.get({
      publicKey: getOptions,
    }) as PublicKeyCredential;
    
    if (!assertion) {
      return { success: false, error: 'Authentication failed' };
    }
    
    const response = assertion.response as AuthenticatorAssertionResponse;
    
    // Update last used timestamp
    const usedCredId = bufferToBase64url(assertion.rawId);
    const updatedCredentials = credentials.map(cred => {
      if (cred.credentialId === usedCredId) {
        return { ...cred, lastUsed: new Date() };
      }
      return cred;
    });
    saveCredentials(updatedCredentials);
    
    return {
      success: true,
      credentialId: usedCredId,
      signature: bufferToBase64url(response.signature),
      authenticatorData: bufferToBase64url(response.authenticatorData),
      clientDataJSON: bufferToBase64url(response.clientDataJSON),
    };
    
  } catch (error: any) {
    if (error.name === 'NotAllowedError') {
      return { success: false, error: 'User cancelled the authentication' };
    }
    if (error.name === 'SecurityError') {
      return { success: false, error: 'Security error - invalid origin' };
    }
    return { success: false, error: error.message || 'Authentication failed' };
  }
}

/**
 * Remove a biometric credential
 */
export function removeCredential(credentialId: string): boolean {
  const credentials = getStoredCredentials();
  const filtered = credentials.filter(c => c.credentialId !== credentialId);
  
  if (filtered.length === credentials.length) {
    return false; // Credential not found
  }
  
  saveCredentials(filtered);
  return true;
}

/**
 * Clear all biometric credentials
 */
export function clearAllCredentials(): void {
  localStorage.removeItem('zassport_biometric_credentials');
}

/**
 * Get device name for credential display
 */
function getDeviceName(): string {
  const ua = navigator.userAgent;
  
  if (/iPhone|iPad|iPod/.test(ua)) {
    return 'iPhone/iPad (Face ID / Touch ID)';
  }
  if (/Mac/.test(ua)) {
    return 'Mac (Touch ID)';
  }
  if (/Android/.test(ua)) {
    return 'Android (Fingerprint)';
  }
  if (/Windows/.test(ua)) {
    return 'Windows (Hello)';
  }
  if (/Linux/.test(ua)) {
    return 'Linux';
  }
  
  return 'Unknown Device';
}

/**
 * Verify a biometric signature (for backend verification)
 * This would be used server-side to verify the assertion
 */
export function verifyBiometricSignature(
  signature: string,
  authenticatorData: string,
  clientDataJSON: string,
  publicKey: string,
  challenge: string
): boolean {
  // In a production environment, this should be done server-side
  // Here we just do basic validation
  
  try {
    // Decode client data JSON
    const clientDataBuffer = base64urlToBuffer(clientDataJSON);
    const clientData = JSON.parse(new TextDecoder().decode(clientDataBuffer));
    
    // Verify challenge matches
    const receivedChallenge = clientData.challenge;
    if (receivedChallenge !== challenge) {
      console.error('Challenge mismatch');
      return false;
    }
    
    // Verify origin
    if (clientData.origin !== window.location.origin) {
      console.error('Origin mismatch');
      return false;
    }
    
    // Verify type
    if (clientData.type !== 'webauthn.get') {
      console.error('Type mismatch');
      return false;
    }
    
    // In production, verify the signature using the public key
    // This requires a crypto library that can handle WebAuthn signatures
    
    return true;
  } catch (e) {
    console.error('Signature verification error:', e);
    return false;
  }
}

/**
 * Create a biometric-gated claim access token
 * This token proves the user authenticated with biometrics
 */
export async function createBiometricAccessToken(
  claimId: string,
  expiresInSeconds: number = 300
): Promise<{ token: string; expiresAt: number } | null> {
  const authResult = await authenticateWithBiometric();
  
  if (!authResult.success) {
    console.error('Biometric auth failed:', authResult.error);
    return null;
  }
  
  const expiresAt = Date.now() + (expiresInSeconds * 1000);
  
  // Create a simple token (in production, use proper JWT or similar)
  const tokenData = {
    claimId,
    credentialId: authResult.credentialId,
    authenticatedAt: Date.now(),
    expiresAt,
    signature: authResult.signature,
  };
  
  const token = btoa(JSON.stringify(tokenData));
  
  return { token, expiresAt };
}

/**
 * Validate a biometric access token
 */
export function validateBiometricAccessToken(token: string): {
  valid: boolean;
  claimId?: string;
  error?: string;
} {
  try {
    const tokenData = JSON.parse(atob(token));
    
    if (Date.now() > tokenData.expiresAt) {
      return { valid: false, error: 'Token expired' };
    }
    
    // Verify credential exists
    const credentials = getStoredCredentials();
    const credentialExists = credentials.some(
      c => c.credentialId === tokenData.credentialId
    );
    
    if (!credentialExists) {
      return { valid: false, error: 'Unknown credential' };
    }
    
    return { valid: true, claimId: tokenData.claimId };
  } catch (e) {
    return { valid: false, error: 'Invalid token' };
  }
}
