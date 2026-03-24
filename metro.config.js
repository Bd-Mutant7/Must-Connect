const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Allow .html files to be bundled as assets
config.resolver.assetExts.push('html');

// Prevent metro from trying to transform HTML
config.resolver.sourceExts = config.resolver.sourceExts.filter(e => e !== 'html');

module.exports = config;
