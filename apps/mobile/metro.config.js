const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Block problematic Node.js modules that don't work in React Native
config.resolver.blockList = [
  /node_modules\/readline\/.*/,
  /node_modules\/fs\/.*/,
  /node_modules\/net\/.*/,
  /node_modules\/tls\/.*/,
  /node_modules\/child_process\/.*/,
  /node_modules\/cluster\/.*/,
  /node_modules\/dgram\/.*/,
  /node_modules\/dns\/.*/,
  /node_modules\/http\/.*/,
  /node_modules\/https\/.*/,
  /node_modules\/url\/.*/,
  /node_modules\/querystring\/.*/,
  /node_modules\/zlib\/.*/,
  /node_modules\/constants\/.*/,
];

// Production crypto setup - use native modules
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  // Native crypto via react-native-quick-crypto
  crypto: require.resolve('react-native-quick-crypto'),
  // Buffer from native implementation
  buffer: require.resolve('@craftzdog/react-native-buffer'),
  // Stream and other Node polyfills
  stream: require.resolve('stream-browserify'),
  path: require.resolve('path-browserify'),
  process: require.resolve('process/browser'),
  assert: require.resolve('assert'),
  events: require.resolve('events'),
  util: require.resolve('util'),
  os: require.resolve('os-browserify/browser'),
  // Node modules that don't work in React Native - provide empty polyfills
  fs: path.resolve(__dirname, 'shims/fs.js'),
  readline: path.resolve(__dirname, 'shims/readline.js'),
  constants: path.resolve(__dirname, 'shims/constants.js'),
  // Shim for legacy packages expecting react-native-randombytes
  'react-native-randombytes': path.resolve(__dirname, 'shims/react-native-randombytes.js'),
};

config.resolver.alias = {
  ...config.resolver.alias,
  crypto: require.resolve('react-native-quick-crypto'),
  buffer: require.resolve('@craftzdog/react-native-buffer'),
  stream: require.resolve('stream-browserify'),
  path: require.resolve('path-browserify'),
  process: require.resolve('process/browser'),
  assert: require.resolve('assert'),
  events: require.resolve('events'),
  util: require.resolve('util'),
  os: require.resolve('os-browserify/browser'),
  fs: path.resolve(__dirname, 'shims/fs.js'),
  readline: path.resolve(__dirname, 'shims/readline.js'),
  constants: path.resolve(__dirname, 'shims/constants.js'),
  'react-native-randombytes': path.resolve(__dirname, 'shims/react-native-randombytes.js'),
  // snarkjs shim for dynamic loading
  snarkjs: path.resolve(__dirname, 'shims/snarkjs.js'),
};

module.exports = config;