import { useQuery } from '@tanstack/react-query';

import { CryptoAsset, CryptoFiatRate } from '@safely/core';

import { assetKeys } from './keys';
import { getRateFn } from './rateQuery';
import { usePriceApi } from '../../shared';
import { useActiveFiat } from '../fiat/useActiveFiat';

export function useRate(asset: CryptoAsset) {
    const fiat = useActiveFiat();
    const priceApi = usePriceApi();

    const query = useQuery<CryptoFiatRate | null>({
        queryKey: assetKeys.rate(asset.id.toString()).fiat(fiat.id.toString()).toKey(),
        queryFn: () => getRateFn(priceApi, asset, fiat)
    });

    return { ...query, isActualised: true as const };
}
