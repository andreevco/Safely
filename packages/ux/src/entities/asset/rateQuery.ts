import type { CryptoAsset, FiatAsset, PriceApi } from '@safely/core';
import { Rate, toBig } from '@safely/core';

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
