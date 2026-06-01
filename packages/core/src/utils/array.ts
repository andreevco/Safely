export const intersectArrays = <T>(a: T[], b: T[]): T[] => {
    const setB = new Set(b);
    return a.filter(x => setB.has(x));
};
