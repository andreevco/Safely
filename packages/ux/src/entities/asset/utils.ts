import { FiatAsset, FiatAssetAmount, RatedCryptoAssetAmount } from '@safely/core';
import { toBig } from '@safely/core';

export function getSortedAssets(assets: RatedCryptoAssetAmount[]): RatedCryptoAssetAmount[] {
    return [...assets].sort((a, b) => {
        const aFiat = a.price ? a.amount.convert(a.price).amount : toBig(0);
        const bFiat = b.price ? b.amount.convert(b.price).amount : toBig(0);

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
    }, toBig(0));

    return new FiatAssetAmount({ asset: fiat, amount: sum });
}
