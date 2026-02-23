import { useQuery } from '@tanstack/react-query';

import { CryptoAsset } from '@safely/core';
import { HistoricalPrice } from '@safely/core/api/price/models';

import { assetKeys } from './keys';
import { usePriceApi } from '../../shared';
import { useActiveFiat } from '../fiat';

export function useChart(asset: CryptoAsset, startDate: number) {
    const fiat = useActiveFiat();
    const priceApi = usePriceApi();

    const query = useQuery<HistoricalPrice | null>({
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
                start_date: startDate,
                end_date: Date.now()
            });

            return response;
        }
    });

    return query;
}
