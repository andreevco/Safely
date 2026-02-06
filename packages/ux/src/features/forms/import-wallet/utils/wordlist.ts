import { wordlist } from '@safely/core';

const wordSet = new Set(wordlist);

export const isValidMnemonicWord = (word: string): boolean => {
    return wordSet.has(word.toLowerCase().trim());
};
