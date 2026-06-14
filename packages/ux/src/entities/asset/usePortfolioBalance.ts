import type { BtcWallet, Portfolio } from '@safely/core';

import { useDerivedQuery } from '../../shared';
import { useActiveFiat } from '../fiat';
import { resolveBtcWallet } from '../portfolio';
import { useWalletAssets } from './useAssets';
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

export function usePortfolioBalance(portfolio: Portfolio) {
    return useBtcWalletFiatBalance(resolveBtcWallet(portfolio));
}
