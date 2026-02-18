import { useQuery } from '@tanstack/react-query';

import { CryptoAsset } from '@safely/core';
import { HistoricalPrice } from '@safely/core/api/price/models';

import { assetKeys } from './keys';
import { usePriceApi } from '../../shared';
import { useActiveFiat } from '../fiat';

interface IChartConfig {
    /**
     * Caching key is used to cache query results by this string,
     * ignoring startDate and endDate
     * (because it changes every time and often chart invalidations will cause bad UX)
     */
    cachingKey: string;
}

export function useChart(asset: CryptoAsset, startDate: number, config: IChartConfig) {
    const fiat = useActiveFiat();
    const priceApi = usePriceApi();

    const query = useQuery<HistoricalPrice | null>({
        queryKey: assetKeys
            .chart(asset.id.toString())
            .fiat(fiat.id.toString())
            .cachingKey(config.cachingKey)
            .toKey(),
        queryFn: async () => {
            const response = await priceApi.getHistoricalPrice({
                token: 'native',
                blockchain: 'bitcoin',
                currency: fiat.id.symbol,
                start_date: startDate,
                end_date: Date.now()
            });

            return response;
        }
    });

    return { ...query, isActualised: true as const };
}
