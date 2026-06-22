import { useMemo } from 'react';

import type { BtcWallet, FiatAssetAmount } from '@safely/core';
import { BTC_ASSET } from '@safely/core';

import { useDerivedQuery } from '../../shared';
import { useBtcWalletBalances } from '../btc-blockchain';
import { useActiveFiat } from '../fiat';
import { useWalletAssets } from './useAssets';
import { useRate } from './useRate';
import { calculateTotalBalance } from './utils';

export function useBtcWalletFiatBalance(wallet: BtcWallet) {
    const assetsQuery = useWalletAssets(wallet);
    const fiat = useActiveFiat();

    return useDerivedQuery({
        queries: [assetsQuery],
        queryFn([assets]) {
            return assets ?? [];
        },
        select(assets) {
            return calculateTotalBalance(assets, fiat);
        }
    });
}

export function useBtcWalletsFiatBalance(wallets: BtcWallet[]): {
    data: FiatAssetAmount | undefined;
    isLoading: boolean;
} {
    const fiat = useActiveFiat();
    const btcPriceQuery = useRate(BTC_ASSET);
    const balances = useBtcWalletBalances(wallets);

    const isLoading = btcPriceQuery.isPending || balances.some(balance => balance === undefined);

    const data = useMemo(() => {
        if (isLoading) {
            return undefined;
        }

        const assets = balances.map(balance => ({
            amount: balance!.display,
            price: btcPriceQuery.data ?? null
        }));

        return calculateTotalBalance(assets, fiat);
    }, [isLoading, balances, btcPriceQuery.data, fiat]);

    return { data, isLoading };
}
