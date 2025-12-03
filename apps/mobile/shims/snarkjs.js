// Shim for snarkjs in React Native
// Since snarkjs is loaded dynamically, this shim prevents Metro from trying to bundle it

module.exports = {
  groth16: {
    prove: () => Promise.reject(new Error('snarkjs not loaded')),
    verify: () => Promise.reject(new Error('snarkjs not loaded')),
    fullProve: () => Promise.reject(new Error('snarkjs not loaded')),
  },
  plonk: {
    prove: () => Promise.reject(new Error('snarkjs not loaded')),
    verify: () => Promise.reject(new Error('snarkjs not loaded')),
  },
  zKey: {
    exportVerificationKey: () => Promise.reject(new Error('snarkjs not loaded')),
  },
};