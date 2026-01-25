import Big from 'big.js';

import { FiatAsset, FiatAssetAmount, RatedCryptoAssetAmount } from '@safely/core/entities';

export function getSortedAssets(assets: RatedCryptoAssetAmount[]): RatedCryptoAssetAmount[] {
    return [...assets].sort((a, b) => {
        const aFiat = a.price ? a.amount.convert(a.price).amount : Big(0);
        const bFiat = b.price ? b.amount.convert(b.price).amount : Big(0);

        return bFiat.gt(aFiat) ? 1 : -1;
    });
}

export function calculateTotalBalance(
    assets: RatedCryptoAssetAmount[],
    fiat: FiatAsset
): FiatAssetAmount {
    const sum = assets.reduce((acc, { amount, price }) => {
        if (price) {
            return acc.plus(amount.convert(price).amount);
        }
        return acc;
    }, Big(0));

    return new FiatAssetAmount({ asset: fiat, amount: sum });
}
