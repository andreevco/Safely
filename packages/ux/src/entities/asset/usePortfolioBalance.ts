import { Portfolio } from '@safely/core';

import { useDerivedQuery } from '../../shared';
import { useActiveFiat } from '../fiat';
import { useWalletAssets } from './useAssets';
import { calculateTotalBalance } from './utils';

export function usePortfolioBalance(portfolio: Portfolio) {
    const assetsQuery = useWalletAssets(portfolio.getBtcWallet());
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
