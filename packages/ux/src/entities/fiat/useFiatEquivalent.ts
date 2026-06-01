import type { CryptoAssetAmount } from '@safely/core';

import { useDerivedQuery } from '../../shared';
import { useRate } from '../asset/useRate';

export function useFiatEquivalent(assetAmount: CryptoAssetAmount) {
    const rate = useRate(assetAmount.asset);

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
