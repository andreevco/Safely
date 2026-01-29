import { useQuery } from '@tanstack/react-query';

import { CryptoAsset, CryptoFiatRate, Rate } from '@safely/core';
import { toBig } from '@safely/core';

import { assetKeys } from './keys';
import { usePriceApi } from '../../shared';
import { useActiveFiat } from '../fiat';

export function useRate(asset: CryptoAsset) {
    const fiat = useActiveFiat();
    const priceApi = usePriceApi();

    const query = useQuery<CryptoFiatRate | null>({
        queryKey: assetKeys.rate(asset.id.toString()).fiat(fiat.id.toString()).toKey(),
        queryFn: async () => {
            const response = await priceApi.getCurrentPrice({
                token: 'native',
                blockchain: 'bitcoin',
                currency: fiat.id.symbol
            });

            return new Rate(
                asset,
                fiat,
                toBig(response.price),
                undefined,
                String(response.diff_24h),
                undefined
            );
        }
    });

    return { ...query, isActualised: true as const };
}
