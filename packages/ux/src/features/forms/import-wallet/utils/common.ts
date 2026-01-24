const NON_STANDARD_SPACES = /[\u00A0\u2007\u202F\u2009]/g;
const ANY_SPACE = /[\s\u00A0\u2007\u202F\u2009]/;

export const hasAnySpace = (v: string) => ANY_SPACE.test(v);

export const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

export const getEmptyMnemonic = (length = 24) => Array.from({ length }, () => '');

export const normalizeWord = (word: string) => word.trim().toLowerCase();

export const normalizeInput = (str: string) =>
    str
        .normalize()
        .replace(NON_STANDARD_SPACES, ' ')
        .replace(/[0-9.]/g, '')
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map(s => s.toLowerCase());
