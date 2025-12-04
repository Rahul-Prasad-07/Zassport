const { Buffer } = require('buffer');

// Shim for react-native-randombytes to work in web/expo environment
function randomBytes(size, callback) {
  const array = new Uint8Array(size);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(array);
  } else {
    // Fallback for environments without crypto
    for (let i = 0; i < size; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  const buffer = Buffer.from(array);
  if (callback) {
    callback(null, buffer);
  }
  return buffer;
}

module.exports = {
  randomBytes,
  seed: undefined,
};