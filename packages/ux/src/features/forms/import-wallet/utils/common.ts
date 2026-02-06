const NON_STANDARD_SPACES = /[\u00A0\u2007\u202F\u2009]/g;

export const normalizeInput = (str: string) =>
    str
        .normalize()
        .replace(NON_STANDARD_SPACES, ' ')
        .replace(/[0-9.]/g, '')
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map(s => s.toLowerCase());
