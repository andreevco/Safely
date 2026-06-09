import { requireNativeModule } from 'expo-modules-core';

interface SafelyCryptoNativeModule {
    pbkdf2Sha512(
        password: Uint8Array,
        salt: Uint8Array,
        iterations: number,
        output: Uint8Array
    ): void;
}

const native = requireNativeModule<SafelyCryptoNativeModule>('SafelyCrypto');

// expo-modules-core resolves the typed-array kind via `constructor.name`
// (TypedArray.cpp, `nameToKindMap.at(...)`), so a `Buffer` from the
// react-native-buffer polyfill — a Uint8Array subclass with a swapped
// prototype — hard-crashes the app. Copy subclassed inputs into plain
// Uint8Array before crossing the boundary.
const toPlainUint8Array = (bytes: Uint8Array): Uint8Array =>
    bytes.constructor === Uint8Array ? bytes : new Uint8Array(bytes);

export function pbkdf2Sha512(
    password: Uint8Array,
    salt: Uint8Array,
    iterations: number,
    keyLength: number
): Uint8Array {
    if (!native) {
        throw new Error('SafelyCrypto native module is unavailable');
    }
    const output = new Uint8Array(keyLength);
    native.pbkdf2Sha512(toPlainUint8Array(password), toPlainUint8Array(salt), iterations, output);
    return output;
}
