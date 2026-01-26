import { BTC_ASSET, CryptoAssetAmount, RatedCryptoAssetAmount } from '@safely/core/entities';

import {
    QUERIES_STALE_TIME,
    QUERIES_REFETCH_INTERVAL,
    usePersistQuery,
    useBtcApi
} from '../../shared';
import { useActiveFiat } from '../fiat';
import { useActiveBtcWallet } from '../portfolio';
import { assetKeys } from './keys';
import { getSortedAssets } from './utils';

export function useAssets() {
    const btcApi = useBtcApi();
    const fiat = useActiveFiat();
    const wallet = useActiveBtcWallet();

    return usePersistQuery<RatedCryptoAssetAmount[]>({
        queryKey: assetKeys.all(wallet.id.toString()).fiat(fiat.id.toString()).toKey(),
        queryFn: async () => {
            const fiatSymbol = fiat.id.symbol;

            const addressInfo = await btcApi.getXpub(wallet, {
                secondaryCurrency: fiatSymbol
            });

            const btcAmount = new CryptoAssetAmount({
                asset: BTC_ASSET,
                weiAmount: addressInfo.balance
            });

            // TODO: Waiting for RateApi
            const btcItem: RatedCryptoAssetAmount = {
                amount: btcAmount,
                price: null
            };

            return getSortedAssets([btcItem]);
        },
        staleTime: QUERIES_STALE_TIME.ASSETS,
        refetchInterval: QUERIES_REFETCH_INTERVAL.DEFAULT,
        meta: {
            persist: true,
            schemaKey: 'sRatedCryptoAssetAmountArray'
        }
    });
}
