module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          alias: {
            buffer: 'buffer',
            crypto: 'crypto-browserify',
          },
        },
      ],
      [
        'transform-inline-environment-variables',
        {
          include: ['NODE_ENV'],
        },
      ],
      'react-native-reanimated/plugin', // if using reanimated
    ],
  };
};