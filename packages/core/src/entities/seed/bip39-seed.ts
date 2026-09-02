import { utf8ToBytes } from '@noble/hashes/utils.js';

import { saf751, saf751Async } from '@safely/sync';

const BIP39_ITERATIONS = 2048;
const BIP39_KEY_LENGTH = 64;

const nfkdBytes = (str: string) => utf8ToBytes(str.normalize('NFKD'));

/**
 * BIP39 seed derivation; identical to @scure/bip39 `mnemonicToSeed`.
 */
export function mnemonicToSeed(mnemonic: string): Promise<Uint8Array> {
    const password = nfkdBytes(mnemonic);
    const passphrase = '';
    const salt = nfkdBytes('mnemonic' + passphrase);

    saf751('core.mnemonicToSeed', {
        chars: mnemonic.length,
        words: mnemonic.split(' ').length,
        passwordBytes: password.byteLength,
        saltBytes: salt.byteLength,
        normalized: mnemonic === mnemonic.normalize('NFKD'),
        hasProvider: typeof globalThis.safelyCrypto?.pbkdf2Sha512 === 'function'
    });

    return saf751Async('core.pbkdf2', () =>
        globalThis.safelyCrypto.pbkdf2Sha512(password, salt, BIP39_ITERATIONS, BIP39_KEY_LENGTH)
    );
}
