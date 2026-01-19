import { generateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english.js';

import { ClosableMnemonicAccessorVault } from '../secret-vault';

export function generateBip39Accessor() {
    const mnemonic = generateMnemonic(wordlist, 128).split(' ');
    return new ClosableMnemonicAccessorVault(mnemonic);
}
