import { useMemo } from 'react';

import { CHART_CONFIG, ChartPeriod } from '../config';

type PriceDiffResult = {
    formatted: string;
    isPositive: boolean;
} | null;

type UsePriceDiffParams = {
    prices: [number, number][];
    selectedPeriod: ChartPeriod;
};

export const usePriceDiff = (params: UsePriceDiffParams): PriceDiffResult => {
    const { prices, selectedPeriod } = params;

    return useMemo(() => {
        if (prices.length < 2) {
            return null;
        }

        const startPoint = Date.now() - CHART_CONFIG[selectedPeriod].fullPeriodLength;
        const periodStartPoint = prices.find(price => price[0] * 1000 >= startPoint);

        if (!periodStartPoint) {
            return null;
        }

        const startPrice = periodStartPoint[1];
        const endPrice = prices[prices.length - 1][1];

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
    }, [prices, selectedPeriod]);
};
