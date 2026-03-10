import { useQueryClient } from '@tanstack/react-query';

import { BTC_ASSET, CryptoAssetAmount, RatedCryptoAssetAmount } from '@safely/core';

import {
    QUERIES_STALE_TIME,
    QUERIES_REFETCH_INTERVAL,
    usePersistQuery,
    useBtcApi,
    usePriceApi
} from '../../shared';
import { useActiveFiat } from '../fiat';
import { useActiveBtcWallet } from '../portfolio';
import { assetKeys } from './keys';
import { fetchRateQuery } from './rateQuery';
import { getSortedAssets } from './utils';

// TODO Think again, maybe detach useBalances in separate query
export function useAssets() {
    const btcApi = useBtcApi();
    const fiat = useActiveFiat();
    const priceApi = usePriceApi();
    const wallet = useActiveBtcWallet();
    const queryClient = useQueryClient();

    return usePersistQuery<RatedCryptoAssetAmount[]>({
        queryKey: assetKeys.all(wallet.id.toString()).fiat(fiat.id.toString()).toKey(),
        queryFn: async () => {
            const fiatSymbol = fiat.id.symbol;

            const [addressInfo, btcPrice] = await Promise.all([
                btcApi.getXpub(wallet, {
                    secondaryCurrency: fiatSymbol
                }),
                fetchRateQuery(queryClient, priceApi, BTC_ASSET, fiat)
            ]);

            const btcAmount = new CryptoAssetAmount({
                asset: BTC_ASSET,
                weiAmount: addressInfo.balance
            });

            const btcItem: RatedCryptoAssetAmount = {
                amount: btcAmount,
                price: btcPrice
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
