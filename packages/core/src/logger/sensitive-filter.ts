import { wordlist } from '@scure/bip39/wordlists/english.js';

const MNEMONIC_WORDS = new Set(wordlist);
const MNEMONIC_THRESHOLD = 12;

const SENSITIVE_PATTERNS: [RegExp, string][] = [
    [/\b(?:[0-9a-fA-F]{2}){16,}\b/g, '[REDACTED:key]'],
    [/Bearer\s+[A-Za-z0-9\-._~+/]+=*/g, 'Bearer [REDACTED]'],
    [/\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g, '[REDACTED:jwt]'],
    [/\b[xtyz]prv[A-Za-z0-9]{107}\b/g, '[REDACTED:xprv]'],
    [/\[\s*(?:"[a-z]{3,8}"\s*,\s*){11,}"[a-z]{3,8}"\s*]/g, '"[REDACTED:mnemonic]"'],
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
    const spans: [number, number][] = [];

    let runStart = -1;
    let runEnd = -1;
    let runLength = 0;

    const flushRun = () => {
        if (runLength >= MNEMONIC_THRESHOLD) {
            spans.push([runStart, runEnd]);
        }

        runLength = 0;
    };

    for (const token of input.matchAll(/[a-z]+/gi)) {
        const word = token[0];
        const start = token.index ?? 0;

        if (MNEMONIC_WORDS.has(word.toLowerCase())) {
            if (runLength === 0) {
                runStart = start;
            }

            runEnd = start + word.length;
            runLength++;
        } else {
            flushRun();
        }
    }

    flushRun();

    if (spans.length === 0) return input;

    let result = '';
    let cursor = 0;

    for (const [start, end] of spans) {
        result += input.slice(cursor, start) + '[REDACTED:mnemonic]';
        cursor = end;
    }

    result += input.slice(cursor);

    return result;
}
