export function hasUnsupportedExtendedKeyPrefix(input: string): boolean {
    return /^[A-Za-z]pub/.test(input) && !/^[XxZz]pub/.test(input);
}
