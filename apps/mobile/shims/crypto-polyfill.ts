// Production polyfills for React Native - loads before any other code
// Uses crypto-browserify for Expo Go compatibility

import 'react-native-get-random-values';
import { Buffer } from '@craftzdog/react-native-buffer';

// Set up Buffer globally FIRST
if (typeof global.Buffer === 'undefined') {
  global.Buffer = Buffer;
}

// For Expo Go, use crypto-browserify (JS-only)
// For development builds, react-native-quick-crypto would be used
let cryptoModule: any;

try {
  // Try native crypto first (development build)
  cryptoModule = require('react-native-quick-crypto');
} catch (e) {
  // Fall back to JS crypto (Expo Go)
  console.log('[Crypto] Using crypto-browserify fallback');
  cryptoModule = require('crypto-browserify');
}

// Polyfill crypto globally
if (typeof global.crypto === 'undefined') {
  global.crypto = {
    getRandomValues: function<T extends ArrayBufferView | null>(array: T): T {
      if (array === null) return array;
      const bytes = array as unknown as Uint8Array;
      for (let i = 0; i < bytes.length; i++) {
        bytes[i] = Math.floor(Math.random() * 256);
      }
      return array;
    },
    subtle: {} as SubtleCrypto,
    randomUUID: () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    }),
  } as Crypto;
}

// Polyfill process
if (typeof global.process === 'undefined') {
  global.process = {
    env: { NODE_ENV: 'production' },
    version: 'v18.0.0',
    platform: 'react-native',
    nextTick: (cb: () => void) => setTimeout(cb, 0),
  } as unknown as NodeJS.Process;
}

// TextEncoder/TextDecoder polyfill
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('text-encoding');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

export { Buffer };
export { cryptoModule as crypto };
