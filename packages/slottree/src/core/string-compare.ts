// String.localeCompare may produce inconsistent results across different browsers and environments.
// `<` and `>` JavaScript operators compare UTF-16 endpoints without locale-specific rules, so this
// function should be consistent between different implementations.
export function compareStrings(a: string, b: string): number {
    return a < b ? -1 : a > b ? 1 : 0;
}
