// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Enable fast refresh and watch mode
config.watchFolders = [__dirname];
config.resolver.sourceExts.push('cjs');

// Ensure hot reloading is enabled
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return middleware;
  },
};

module.exports = config;

