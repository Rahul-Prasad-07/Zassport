// Polyfill for Node.js fs module in React Native
// snarkjs tries to import this but we don't need file system access

const fs = {
  readFileSync: () => { throw new Error('fs.readFileSync not supported in React Native'); },
  writeFileSync: () => { throw new Error('fs.writeFileSync not supported in React Native'); },
  existsSync: () => false,
  statSync: () => ({ isFile: () => false, isDirectory: () => false }),
  readdirSync: () => [],
  mkdirSync: () => {},
  unlinkSync: () => {},
  rmdirSync: () => {},
};

module.exports = fs;