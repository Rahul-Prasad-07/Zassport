// Polyfill for Node.js readline module in React Native
// snarkjs tries to import this but we don't need interactive input

const readline = {
  createInterface: () => ({
    question: (query, callback) => {
      // For React Native, we can't do interactive input
      // Return empty string or throw error
      throw new Error('Interactive input not supported in React Native');
    },
    close: () => {},
    on: () => {},
    removeListener: () => {},
  }),
  Interface: class {
    constructor() {
      this.question = () => { throw new Error('Interactive input not supported in React Native'); };
      this.close = () => {};
      this.on = () => {};
      this.removeListener = () => {};
    }
  }
};

module.exports = readline;