import { useMemo } from 'react';

import type { ChartPeriod } from '../config';
import { CHART_CONFIG } from '../config';

type UsePriceDiffParams = {
    prices: [number, number][];
    selectedPeriod: ChartPeriod;
};

export const usePriceDiff = (params: UsePriceDiffParams): number | null => {
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
        return diff === 0 ? null : diff;
    }, [prices, selectedPeriod]);
};
