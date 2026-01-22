import { generateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english.js';

import { MnemonicResource } from '../mnemonic';

export function generateBip39Accessor() {
    const mnemonic = generateMnemonic(wordlist, 128).split(' ');
    return new MnemonicResource(mnemonic);
}
