import { pbkdf2Async } from '@noble/hashes/pbkdf2.js';
import { sha512 } from '@noble/hashes/sha2.js';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils.js';

import { logger } from '@mobile/shared/logger';

import { pbkdf2Sha512 as nativePbkdf2Sha512 } from '../modules/safely-crypto/src';

const nativePbkdf2Sha512Async = (...args: Parameters<typeof nativePbkdf2Sha512>) => {
    return Promise.resolve(nativePbkdf2Sha512(...args));
};

const noblePbkdf2Sha512Async: typeof globalThis.safelyCrypto.pbkdf2Sha512 = (
    password,
    salt,
    iterations,
    keyLength
) => pbkdf2Async(sha512, password, salt, { c: iterations, dkLen: keyLength });

// Installs the `safelyCrypto` provider used by @safely/core for BIP39 seed
// derivation. The native PBKDF2 (~10ms vs ~2s for pure-JS on Hermes) is trusted
// only after a self-check against a known BIP39 vector: a wrong derived key
// means wrong wallet addresses, so on any mismatch (or missing/broken native
// module) we fall back to the pure-JS noble implementation.

// BIP39 PBKDF2 self-check vector (Trezor #1, empty passphrase).
const SELF_CHECK = {
    password:
        'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
    salt: 'mnemonic',
    iterations: 2048,
    keyLength: 64,
    derivedKeyHex:
        '5eb00bbddcf069084889a8ab9155568165f5c453ccb85e70811aaed6f6da5fc19a5ac40b389cd370d086206dec8aa6c43daea6690f20ad3d8d48b2d2ce9e38e4'
} as const;

let nativeMatchesVector: boolean | undefined;
try {
    const derived = nativePbkdf2Sha512(
        utf8ToBytes(SELF_CHECK.password),
        utf8ToBytes(SELF_CHECK.salt),
        SELF_CHECK.iterations,
        SELF_CHECK.keyLength
    );
    nativeMatchesVector = bytesToHex(derived) === SELF_CHECK.derivedKeyHex;
} catch (error) {
    logger.error('[pbkdf2] native self-check threw', error);
    nativeMatchesVector = false;
}

export const pbkdf2Sha512 = nativeMatchesVector ? nativePbkdf2Sha512Async : noblePbkdf2Sha512Async;
