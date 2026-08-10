/**
 * Reshapes `@safely/ux/theme` into Panda tokens. It must never restate a value — the theme
 * objects are the only source, shared with mobile.
 */
type TokenValue = string | number;

interface TokenSource {
    [key: string]: TokenValue | TokenSource;
}

interface TokenLeaf {
    value: string;
}

export interface TokenTree {
    [key: string]: TokenLeaf | TokenTree;
}

const isTokenValue = (value: TokenValue | TokenSource): value is TokenValue =>
    typeof value === 'string' || typeof value === 'number';

export const px = (value: TokenValue): string => (typeof value === 'number' ? `${value}px` : value);

export const raw = (value: TokenValue): string => String(value);

export function toTokens(source: TokenSource, format: (value: TokenValue) => string): TokenTree {
    const tokens: TokenTree = {};

    for (const [key, value] of Object.entries(source)) {
        tokens[key] = isTokenValue(value) ? { value: format(value) } : toTokens(value, format);
    }

    return tokens;
}
