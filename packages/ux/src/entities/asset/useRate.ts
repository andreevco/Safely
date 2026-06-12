import type { CryptoAsset, CryptoFiatRate } from '@safely/core';

import { assetKeys } from './keys';
import { getRateFn } from './rateQuery';
import { usePersistQuery, usePriceApi } from '../../shared';
import { useActiveFiat } from '../fiat/useActiveFiat';

export function useRate(asset: CryptoAsset) {
    const fiat = useActiveFiat();
    const priceApi = usePriceApi();

    const query = usePersistQuery<CryptoFiatRate | null>({
        queryKey: assetKeys.rate(asset.id.toString()).fiat(fiat.id.toString()).toKey(),
        queryFn: () => getRateFn(priceApi, asset, fiat),
        schemaKey: 'sCryptoFiatRate'
    });

    return query;
}
