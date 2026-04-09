import { wordlist } from '@scure/bip39/wordlists/english.js';

const MNEMONIC_WORDS = new Set(wordlist);
const MNEMONIC_THRESHOLD = 12;

const SENSITIVE_PATTERNS: [RegExp, string][] = [
    [/\b[0-9a-fA-F]{64}\b/g, '[REDACTED:key]'],
    [/Bearer\s+[A-Za-z0-9\-._~+/]+=*/g, 'Bearer [REDACTED]'],
    [/\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g, '[REDACTED:jwt]'],
    [/\b[xtyz]prv[A-Za-z0-9]{107}\b/g, '[REDACTED:xprv]'],
    [
        /(?:api[_-]?key|apikey|token|secret|password|authorization)['":=\s]+['"]?[\w\-./+=]{16,}['"]?/gi,
        '[REDACTED:credential]'
    ]
];

export function filterSensitiveData(input: string): string {
    let result = input;

    for (const [pattern, replacement] of SENSITIVE_PATTERNS) {
        result = result.replace(pattern, replacement);
    }

    result = maskMnemonics(result);

    return result;
}

function maskMnemonics(input: string): string {
    const words = input.split(/\s+/);
    let consecutiveCount = 0;
    let startIndex = -1;

    const ranges: [number, number][] = [];

    for (let i = 0; i < words.length; i++) {
        if (MNEMONIC_WORDS.has(words[i].toLowerCase())) {
            if (consecutiveCount === 0) {
                startIndex = i;
            }

            consecutiveCount++;
        } else {
            if (consecutiveCount >= MNEMONIC_THRESHOLD) {
                ranges.push([startIndex, i]);
            }

            consecutiveCount = 0;
        }
    }

    if (consecutiveCount >= MNEMONIC_THRESHOLD) {
        ranges.push([startIndex, words.length]);
    }

    if (ranges.length === 0) return input;

    for (const [start, end] of ranges.reverse()) {
        words.splice(start, end - start, '[REDACTED:mnemonic]');
    }

    return words.join(' ');
}
