import { validateMnemonic as validateBip39Mnemonic } from '@scure/bip39';
import { wordlist as bip39Wordlist } from '@scure/bip39/wordlists/english.js';

import { assertUnreachable } from '../../utils/types';

export type IMnemonic = string[];

export enum MNEMONIC_TYPE {
    BIP39 = 'BIP39'
}

export { bip39Wordlist as wordlist };

export async function validateMnemonic(type: MNEMONIC_TYPE, secret: IMnemonic) {
    if (type === MNEMONIC_TYPE.BIP39) {
        const isValid = validateBip39Mnemonic(secret.join(' '), bip39Wordlist);

        if (!isValid) {
            throw new Error(`Mnemonic is not valid BIP39 mnemonic`);
        }
    } else {
        assertUnreachable(type);
    }
}
