import { requireNativeModule } from 'expo-modules-core';

interface SafelyPbkdf2NativeModule {
    pbkdf2Sha512(
        password: Uint8Array,
        salt: Uint8Array,
        iterations: number,
        output: Uint8Array
    ): void;
}

// Guarded: if the native module isn't linked (packaging/build issue),
// `requireNativeModule` throws. We catch it so the caller can fall back to JS
// instead of crashing at app startup.
let native: SafelyPbkdf2NativeModule | null = null;
try {
    native = requireNativeModule<SafelyPbkdf2NativeModule>('SafelyPbkdf2');
} catch {
    native = null;
}

// expo-modules-core resolves the typed-array kind via `constructor.name`
// (TypedArray.cpp, `nameToKindMap.at(...)`), so a `Buffer` from the
// react-native-buffer polyfill — a Uint8Array subclass with a swapped
// prototype — hard-crashes the app. Copy subclassed inputs into plain
// Uint8Array before crossing the boundary.
const toPlainUint8Array = (bytes: Uint8Array): Uint8Array =>
    bytes.constructor === Uint8Array ? bytes : new Uint8Array(bytes);

/**
 * Native PBKDF2-HMAC-SHA512 (CommonCrypto / javax.crypto.Mac).
 * Synchronous: ~10ms for 2048 iterations vs ~2s for the pure-JS fallback on Hermes.
 * Throws if the native module is unavailable.
 */
export function pbkdf2Sha512(
    password: Uint8Array,
    salt: Uint8Array,
    iterations: number,
    keyLength: number
): Uint8Array {
    if (!native) {
        throw new Error('SafelyPbkdf2 native module is unavailable');
    }
    const output = new Uint8Array(keyLength);
    native.pbkdf2Sha512(toPlainUint8Array(password), toPlainUint8Array(salt), iterations, output);
    return output;
}
