import type { CryptoAsset, CryptoFiatRate } from '@safely/core';
import { toBig } from '@safely/core';
import { Rate } from '@safely/core';

import { assetKeys } from './keys';
import { getRateFn } from './rateQuery';
import { usePersistQuery, usePriceApi } from '../../shared';
import { useActiveFiat } from '../fiat/useActiveFiat';
import { useIsActivePortfolioTestnet } from '../portfolio';

export function useRate(asset: CryptoAsset) {
    const fiat = useActiveFiat();
    const priceApi = usePriceApi();
    const isTestnet = useIsActivePortfolioTestnet();

    return usePersistQuery<CryptoFiatRate | null>({
        queryKey: assetKeys
            .rate(asset.id.toString())
            .fiat(fiat.id.toString())
            .params({ isTestnet })
            .toKey(),
        queryFn: () =>
            isTestnet ? new Rate(asset, fiat, toBig(0)) : getRateFn(priceApi, asset, fiat),
        schemaKey: 'sCryptoFiatRate'
    });
}
