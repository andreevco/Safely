import { BTC_ASSET, CryptoAssetAmount, RatedCryptoAssetAmount, Rate } from '@safely/core';
import { toBig } from '@safely/core';

import {
    QUERIES_STALE_TIME,
    QUERIES_REFETCH_INTERVAL,
    usePersistQuery
    // useBtcApi,
    // usePriceApi
} from '../../shared';
import { useActiveFiat } from '../fiat';
import { useActiveBtcWallet } from '../portfolio';
import { assetKeys } from './keys';
import { getSortedAssets } from './utils';

export function useAssets() {
    // const btcApi = useBtcApi();
    const fiat = useActiveFiat();
    // const priceApi = usePriceApi();
    const wallet = useActiveBtcWallet();

    return usePersistQuery<RatedCryptoAssetAmount[]>({
        queryKey: assetKeys.all(wallet.id.toString()).fiat(fiat.id.toString()).toKey(),
        queryFn: async () => {
            const fiatSymbol = fiat.id.symbol;

            const [addressInfo, priceResponse] = await Promise.all([
                btcApi.getXpub(wallet, {
                    secondaryCurrency: fiatSymbol
                }),
                priceApi.getCurrentPrice({
                    token: 'native',
                    currency: fiatSymbol,
                    blockchain: 'bitcoin'
                })
            ]);

            const btcAmount = new CryptoAssetAmount({
                asset: BTC_ASSET,
                weiAmount: addressInfo.balance
            });

            const btcPrice = priceResponse
                ? new Rate(
                      BTC_ASSET,
                      fiat,
                      toBig(priceResponse.price),
                      undefined,
                      String(priceResponse.diff_24h),
                      undefined
                  )
                : null;

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
