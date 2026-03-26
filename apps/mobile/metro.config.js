const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
    buffer: require.resolve('@craftzdog/react-native-buffer'),
    'isomorphic-webcrypto': path.resolve(__dirname, 'shims/isomorphic-webcrypto')
};

module.exports = config;
