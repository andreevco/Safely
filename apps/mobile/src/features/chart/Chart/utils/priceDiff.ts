export type PriceDiffValue = {
    formatted: string;
    isPositive: boolean;
} | null;

export const getPriceDiff = (startPrice: number, endPrice: number): PriceDiffValue => {
    if (startPrice === 0) {
        return null;
    }

    const diff = ((endPrice - startPrice) / startPrice) * 100;
    const abs = Math.abs(diff);

    let formatted: string;
    if (abs >= 1) {
        formatted = parseFloat(abs.toFixed(1)).toString();
    } else if (abs === 0) {
        return null;
    } else {
        const decimals = -Math.floor(Math.log10(abs));
        formatted = abs.toFixed(decimals);
    }

    return { formatted, isPositive: diff > 0 };
};
