import { Portfolio } from '@safely/core';

import { useDerivedQuery } from '../../shared';
import { useActiveFiat } from '../fiat';
import { useWalletAssets } from './useAssets';
import { calculateTotalBalance } from './utils';

export function usePortfolioBalance(portfolio: Portfolio) {
    // TODO: should think for solution for multiple derivations
    const assetsQuery = useWalletAssets(portfolio.derivations[0].chains.btc.wallets[0]);
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
