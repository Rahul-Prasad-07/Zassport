const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  buffer: require.resolve('buffer'),
};

config.resolver.alias = {
  ...config.resolver.alias,
  buffer: require.resolve('buffer'),
};

module.exports = config;