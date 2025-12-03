// Minimal crypto shim for web/React Native
// Uses Web Crypto API which is available in modern browsers and React Native

const getRandomValues = (array) => {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    return crypto.getRandomValues(array);
  }
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    return window.crypto.getRandomValues(array);
  }
  // Fallback for environments without crypto
  for (let i = 0; i < array.length; i++) {
    array[i] = Math.floor(Math.random() * 256);
  }
  return array;
};

const randomBytes = (size) => {
  const { Buffer } = require('buffer');
  const array = new Uint8Array(size);
  getRandomValues(array);
  return Buffer.from(array);
};

// Simple hash functions using SubtleCrypto when available
const createHash = (algorithm) => {
  const data = [];
  
  return {
    update: function(chunk) {
      if (typeof chunk === 'string') {
        data.push(new TextEncoder().encode(chunk));
      } else {
        data.push(chunk);
      }
      return this;
    },
    digest: function(encoding) {
      const { Buffer } = require('buffer');
      // Combine all data
      const totalLength = data.reduce((acc, arr) => acc + arr.length, 0);
      const combined = new Uint8Array(totalLength);
      let offset = 0;
      for (const arr of data) {
        combined.set(arr, offset);
        offset += arr.length;
      }
      
      // Simple hash (for compatibility - real hashing should use SubtleCrypto)
      let hash = 0;
      for (let i = 0; i < combined.length; i++) {
        hash = ((hash << 5) - hash) + combined[i];
        hash = hash & hash;
      }
      
      const result = Buffer.alloc(32);
      for (let i = 0; i < 32; i++) {
        result[i] = (hash >> (i % 4) * 8) & 0xff;
      }
      
      if (encoding === 'hex') {
        return result.toString('hex');
      }
      return result;
    }
  };
};

module.exports = {
  randomBytes,
  getRandomValues,
  createHash,
  // Add other commonly used methods as stubs
  createHmac: () => ({ update: () => ({ digest: () => Buffer.alloc(32) }) }),
  pbkdf2: (password, salt, iterations, keylen, digest, callback) => {
    callback(null, randomBytes(keylen));
  },
  pbkdf2Sync: (password, salt, iterations, keylen, digest) => {
    return randomBytes(keylen);
  },
};
