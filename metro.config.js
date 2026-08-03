const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for cjs files
config.resolver.sourceExts = [
  ...config.resolver.sourceExts,
  'cjs',
];

// Fix for PlatformConstants
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    ...config.transformer.minifierConfig,
    mangle: {
      keep_fnames: true,
    },
  },
};

module.exports = config;