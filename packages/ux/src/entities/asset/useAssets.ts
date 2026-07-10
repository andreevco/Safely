import type { BtcWallet, RatedCryptoAssetAmount } from '@safely/core';
import { BTC_ASSET, BtcNetwork } from '@safely/core';

import { useDerivedQuery } from '../../shared';
import { useActiveBtcWallet } from '../portfolio';
import { getSortedAssets } from './utils';
import { useBtcBalance } from '../btc-blockchain';
import { useRate } from './useRate';

export function useWalletAssets(wallet: BtcWallet) {
    const btcWalletUtxosQuery = useBtcBalance(wallet);
    const btcPriceQuery = useRate(BTC_ASSET, wallet.network === BtcNetwork.TESTNET);

    return useDerivedQuery({
        queries: [btcWalletUtxosQuery, btcPriceQuery],
        queryFn: ([{ display: btcBalance }, btcPrice]) => {
            const btcItem: RatedCryptoAssetAmount = {
                amount: btcBalance,
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
