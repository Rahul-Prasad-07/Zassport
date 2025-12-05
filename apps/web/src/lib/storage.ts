/**
 * Encrypted Passport Storage Utilities
 * 
 * Uses wallet signature as encryption key to store passport data in localStorage.
 * This allows passport data to persist across page refreshes without requiring
 * users to rescan their passport every time.
 * 
 * Security Model:
 * - Data is encrypted using AES-GCM with a key derived from wallet signature
 * - Only the wallet owner can decrypt the data (requires wallet signature)
 * - Each wallet has its own storage key
 * - Data is cleared when user explicitly clears it or wallet changes
 */

import { PassportData } from '@/contexts/PassportDataContext';

const STORAGE_PREFIX = 'zassport_passport_';
const SIGNATURE_MESSAGE = 'Zassport: Unlock your encrypted passport data';

/**
 * Derive encryption key from wallet signature using PBKDF2
 */
async function deriveKeyFromSignature(signature: Uint8Array): Promise<CryptoKey> {
  // Import signature as raw key material
  const sigBuffer = new Uint8Array(signature.slice(0, 32)).buffer;
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    sigBuffer, // Use first 32 bytes of signature
    'PBKDF2',
    false,
    ['deriveKey']
  );

  // Derive AES-GCM key using PBKDF2
  const salt = new TextEncoder().encode('zassport-v1');
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: new Uint8Array(salt).buffer,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt passport data using AES-GCM
 */
async function encryptData(data: PassportData, key: CryptoKey): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(JSON.stringify(data));
  
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: new Uint8Array(iv).buffer },
    key,
    new Uint8Array(encoded).buffer
  );

  // Combine IV + encrypted data and encode as base64
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt passport data using AES-GCM
 */
async function decryptData(encryptedString: string, key: CryptoKey): Promise<PassportData> {
  const combined = Uint8Array.from(atob(encryptedString), c => c.charCodeAt(0));
  
  // Extract IV and encrypted data
  const iv = combined.slice(0, 12);
  const encrypted = combined.slice(12);
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    encrypted
  );
  
  return JSON.parse(new TextDecoder().decode(decrypted));
}

/**
 * Get storage key for a wallet
 */
function getStorageKey(walletAddress: string): string {
  return `${STORAGE_PREFIX}${walletAddress}`;
}

/**
 * Store encrypted passport data in localStorage
 * 
 * @param passportData - The passport data to store
 * @param walletAddress - The wallet address (used as storage key identifier)
 * @param signMessage - Function to sign a message with the wallet
 * @returns true if storage was successful
 */
export async function storeEncryptedPassport(
  passportData: PassportData,
  walletAddress: string,
  signMessage: (message: Uint8Array) => Promise<Uint8Array>
): Promise<boolean> {
  try {
    console.log('🔐 [Storage] Encrypting passport data for storage...');
    
    // Get signature for encryption key
    const messageBytes = new TextEncoder().encode(SIGNATURE_MESSAGE);
    const signature = await signMessage(messageBytes);
    
    // Derive encryption key from signature
    const key = await deriveKeyFromSignature(signature);
    
    // Encrypt passport data
    const encrypted = await encryptData(passportData, key);
    
    // Store in localStorage
    const storageKey = getStorageKey(walletAddress);
    localStorage.setItem(storageKey, encrypted);
    
    // Also store a flag indicating data exists (unencrypted)
    localStorage.setItem(`${storageKey}_exists`, 'true');
    
    console.log('✅ [Storage] Passport data encrypted and stored');
    return true;
  } catch (error) {
    console.error('❌ [Storage] Failed to store encrypted passport:', error);
    return false;
  }
}

/**
 * Load encrypted passport data from localStorage
 * 
 * @param walletAddress - The wallet address
 * @param signMessage - Function to sign a message with the wallet
 * @returns The decrypted passport data, or null if not found/failed
 */
export async function loadEncryptedPassport(
  walletAddress: string,
  signMessage: (message: Uint8Array) => Promise<Uint8Array>
): Promise<PassportData | null> {
  try {
    const storageKey = getStorageKey(walletAddress);
    const encrypted = localStorage.getItem(storageKey);
    
    if (!encrypted) {
      console.log('📭 [Storage] No stored passport data found');
      return null;
    }
    
    console.log('🔓 [Storage] Decrypting stored passport data...');
    
    // Get signature for decryption key
    const messageBytes = new TextEncoder().encode(SIGNATURE_MESSAGE);
    const signature = await signMessage(messageBytes);
    
    // Derive decryption key from signature
    const key = await deriveKeyFromSignature(signature);
    
    // Decrypt passport data
    const passportData = await decryptData(encrypted, key);
    
    console.log('✅ [Storage] Passport data decrypted successfully');
    return passportData;
  } catch (error) {
    console.error('❌ [Storage] Failed to load encrypted passport:', error);
    return null;
  }
}

/**
 * Check if there's stored passport data for a wallet (without decrypting)
 */
export function hasStoredPassport(walletAddress: string): boolean {
  const storageKey = getStorageKey(walletAddress);
  return localStorage.getItem(`${storageKey}_exists`) === 'true';
}

/**
 * Clear stored passport data for a wallet
 */
export function clearStoredPassport(walletAddress: string): void {
  const storageKey = getStorageKey(walletAddress);
  localStorage.removeItem(storageKey);
  localStorage.removeItem(`${storageKey}_exists`);
  console.log('🗑️ [Storage] Stored passport data cleared');
}

/**
 * Clear all stored passport data (all wallets)
 */
export function clearAllStoredPassports(): void {
  const keys = Object.keys(localStorage).filter(k => k.startsWith(STORAGE_PREFIX));
  keys.forEach(k => localStorage.removeItem(k));
  console.log('🗑️ [Storage] All stored passport data cleared');
}

/**
 * Get the signature message used for encryption
 * (Useful for UI to show what user is signing)
 */
export function getSignatureMessage(): string {
  return SIGNATURE_MESSAGE;
}
