import { BTC_ASSET, BtcAssetAmount, BtcWallet, RatedCryptoAssetAmount } from '@safely/core';

import { useDerivedQuery } from '../../shared';
import { useActiveBtcWallet } from '../portfolio';
import { getSortedAssets } from './utils';
import { useBtcWalletUtxo } from '../btc-blockchain';
import { useRate } from './useRate';

export function useWalletAssets(wallet: BtcWallet) {
    const btcWalletUtxosQuery = useBtcWalletUtxo(wallet);
    const btcPriceQuery = useRate(BTC_ASSET);

    return useDerivedQuery({
        queries: [btcWalletUtxosQuery, btcPriceQuery],
        queryFn: ([{ confirmedIn, unconfirmedInSafe, unconfirmedOut }, btcPrice]) => {
            const totalReceive = confirmedIn.totalAmount.amountAdd(unconfirmedInSafe.totalAmount);

            const totalBalance = totalReceive.gt(unconfirmedOut.totalAmount)
                ? totalReceive.amountSub(unconfirmedOut.totalAmount)
                : BtcAssetAmount.fromWeiAmount('0');

            const btcItem: RatedCryptoAssetAmount = {
                amount: totalBalance,
                price: btcPrice
            };

            return getSortedAssets([btcItem]);
        }
    });
}

export function useAssets() {
    const wallet = useActiveBtcWallet();

    return useWalletAssets(wallet);
}
