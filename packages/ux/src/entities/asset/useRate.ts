import { useQuery } from '@tanstack/react-query';

import { CryptoAsset, CryptoFiatRate } from '@safely/core/entities';

import { assetKeys } from './keys';
import { useActiveFiat } from '../fiat';

export function useRate(asset: CryptoAsset) {
    const fiat = useActiveFiat();

    const query = useQuery<CryptoFiatRate | null>({
        queryKey: assetKeys.rate(asset.id.toString()).fiat(fiat.id.toString()).toKey(),
        queryFn: async () => {
            // TODO: We need rateAPI first
            return null;
        }
    });

    return { ...query, isActualised: true as const };
}
