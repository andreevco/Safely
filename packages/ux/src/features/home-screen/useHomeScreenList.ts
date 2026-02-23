import { FiatAssetAmount } from '@safely/core';
import { toBig } from '@safely/core';

import { useAssets, useActiveFiat } from '../../entities';
import { useDerivedQuery } from '../../shared';

const MAX_TOP_ASSETS_QTY = 5;

export function useHomeScreenList(maxTopTokensQty = MAX_TOP_ASSETS_QTY) {
    const assetsQuery = useAssets();
    const fiat = useActiveFiat();

    return useDerivedQuery({
        queries: [assetsQuery],
        queryFn([assetsData]) {
            return assetsData ?? [];
        },
        select(assets) {
            const topTokens = assets.slice(0, maxTopTokensQty);
            const restTokens = assets.slice(maxTopTokensQty);

            const commonAmount = restTokens.reduce((acc, { amount, price }) => {
                if (price) {
                    return acc.plus(amount.convert(price).amount);
                }
                return acc;
            }, toBig(0));

            return {
                topTokens,
                restTokens: {
                    tokens: restTokens,
                    commonAmount: new FiatAssetAmount({ asset: fiat, amount: commonAmount })
                }
            };
        }
    });
}
