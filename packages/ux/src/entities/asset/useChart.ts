import { CryptoAsset } from '@safely/core';
import { HistoricalPrice } from '@safely/core/api/price/models';

import { assetKeys } from './keys';
import {
    QUERIES_REFETCH_INTERVAL,
    QUERIES_STALE_TIME,
    usePersistQuery,
    usePriceApi
} from '../../shared';
import { useActiveFiat } from '../fiat';

export function useChart(asset: CryptoAsset, startDate: number) {
    const fiat = useActiveFiat();
    const priceApi = usePriceApi();

    const query = usePersistQuery<HistoricalPrice | null>({
        queryKey: assetKeys
            .chart(asset.id.toString())
            .fiat(fiat.id.toString())
            .startDate(startDate.toString())
            .toKey(),
        queryFn: async () => {
            const response = await priceApi.getHistoricalPrice({
                token: 'native',
                blockchain: 'bitcoin',
                currency: fiat.id.symbol,
                start_date: Math.floor(startDate / 1000),
                end_date: Math.floor(Date.now() / 1000)
            });

            return response;
        },
        staleTime: QUERIES_STALE_TIME.DEFAULT,
        refetchInterval: QUERIES_REFETCH_INTERVAL.DEFAULT,
        meta: {
            persist: true,
            schemaKey: 'sHistoricalPrice'
        }
    });

    return query;
}
