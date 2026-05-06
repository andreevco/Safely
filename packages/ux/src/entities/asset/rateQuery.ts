import type { QueryClient } from '@tanstack/react-query';

import type { CryptoAsset, FiatAsset, PriceApi } from '@safely/core';
import { Rate, toBig } from '@safely/core';

import { assetKeys } from './keys';

export async function getRateFn(priceApi: PriceApi, asset: CryptoAsset, fiat: FiatAsset) {
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

export function fetchRateQuery(
    queryClient: QueryClient,
    priceApi: PriceApi,
    asset: CryptoAsset,
    fiat: FiatAsset
) {
    return queryClient.fetchQuery({
        queryKey: assetKeys.rate(asset.id.toString()).fiat(fiat.id.toString()).toKey(),
        queryFn: () => getRateFn(priceApi, asset, fiat)
    });
}
