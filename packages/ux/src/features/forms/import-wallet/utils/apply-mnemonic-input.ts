import type { WordsNumber } from '../types';
import { hasAnySpace, normalizeInput, normalizeWord } from './common';

export type ApplyMnemonicInputParams = {
    prev: string[];
    index: number;
    rawValue: string;
    wordsNumber: WordsNumber;
};

export type ApplyMnemonicInputResult = {
    next: string[];
    focusIndex?: number;
};

export function applyMnemonicInput(params: ApplyMnemonicInputParams): ApplyMnemonicInputResult {
    const { prev, index, rawValue, wordsNumber } = params;

    if (!hasAnySpace(rawValue)) {
        const next = prev.slice();
        next[index] = normalizeWord(rawValue);

        return { next };
    }

    let words = normalizeInput(rawValue);
    if (words.length === 0) return { next: prev };

    if (words.length === 1) {
        const next = prev.slice();
        next[index] = words[0];

        if (index < wordsNumber - 1) {
            return { next, focusIndex: index + 1 };
        }

        return { next };
    }

    const max = Math.min(wordsNumber - index, words.length);
    words = words.slice(0, max);

    const next = prev.slice();
    for (let i = 0; i < max; i++) {
        next[index + i] = words[i];
    }

    return {
        next,
        focusIndex: Math.min(index + max - 1, wordsNumber - 1)
    };
}
