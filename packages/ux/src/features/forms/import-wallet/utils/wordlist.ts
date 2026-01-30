import { wordlist } from '@safely/core';

const wordSet = new Set(wordlist);

export const isValidMnemonicWord = (word: string): boolean => {
    return wordSet.has(word.toLowerCase().trim());
};

export const getEmptyWordIndex = (words: string[]): number => {
    return words.findIndex(word => word === '');
};

export const getInvalidWordIndex = (words: string[]): number => {
    return words.findIndex(word => !isValidMnemonicWord(word));
};
