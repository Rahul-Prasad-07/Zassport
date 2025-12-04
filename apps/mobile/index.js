// This file MUST be the entry point - it sets up polyfills before ANYTHING else
import { Buffer } from 'buffer';
import process from 'process';

// Set globals IMMEDIATELY - before any other imports
global.Buffer = Buffer;
global.process = process;

// Polyfill crypto for web
if (typeof global.crypto === 'undefined') {
  global.crypto = {};
}
if (!global.crypto.getRandomValues) {
  global.crypto.getRandomValues = function(array) {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  };
}

// Also set on window for web environment
if (typeof window !== 'undefined') {
  window.Buffer = Buffer;
  window.process = process;
}

// NOW import the actual app entry point
import 'expo-router/entry';
