// Global polyfills - must be imported before any other modules
import { Buffer } from 'buffer';
import process from 'process';

// Set up global.process FIRST - required by readable-stream
global.process = process;

// Polyfill Buffer
global.Buffer = global.Buffer || Buffer;

// Polyfill crypto.getRandomValues
if (typeof global.crypto === 'undefined') {
  global.crypto = {} as Crypto;
}
if (!global.crypto.getRandomValues) {
  global.crypto.getRandomValues = function<T extends ArrayBufferView | null>(array: T): T {
    if (array === null) return array;
    const bytes = array as unknown as Uint8Array;
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
    return array;
  };
}

export {};
