export function hasUnsupportedExtendedKeyPrefix(input: string): boolean {
    return /^[A-Za-z]pub/.test(input) && !/^[Xx]pub/.test(input);
}
