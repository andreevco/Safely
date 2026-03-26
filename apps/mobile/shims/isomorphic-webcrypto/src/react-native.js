const { getRandomValues } = require('expo-crypto');

function ensureSecure() { }

const subtle = (globalThis.crypto && globalThis.crypto.subtle) || {};

module.exports = { ensureSecure, getRandomValues, subtle };
