import { useMemo } from 'react';

import type { ChartPeriod } from '../config';
import { CHART_CONFIG } from '../config';
import { getPriceDiff, type PriceDiffValue } from '../utils/priceDiff';

type UsePriceDiffParams = {
    prices: [number, number][];
    selectedPeriod: ChartPeriod;
};

export const usePriceDiff = (params: UsePriceDiffParams): PriceDiffValue => {
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

        return getPriceDiff(startPrice, endPrice);
    }, [prices, selectedPeriod]);
};
