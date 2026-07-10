import type { CryptoAssetAmount } from '@safely/core';

import { useDerivedQuery } from '../../shared';
import { useActivePortfolioRate } from '../asset/useRate';

export function useFiatEquivalent(assetAmount: CryptoAssetAmount) {
    const rate = useActivePortfolioRate(assetAmount.asset);

    return useDerivedQuery({
        queries: [rate],
        queryFn: ([rateData]) => {
            if (!rateData) {
                return null;
            }

            return assetAmount.convert(rateData);
        }
    });
}
