export function isFirstSemverStringGreater(a: string, b: string): boolean {
    const toParts = (str: string) => (str.match(/\d+/g) || []).map(n => Number(n));

    const partsA = toParts(a);
    const partsB = toParts(b);

    const maxLength = Math.max(partsA.length, partsB.length);

    for (let i = 0; i < maxLength; i++) {
        const numA = partsA[i] ?? 0;
        const numB = partsB[i] ?? 0;

        if (numA > numB) return true;
        if (numA < numB) return false;
    }

    return false;
}
