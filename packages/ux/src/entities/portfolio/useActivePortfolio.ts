import { keepPreviousData } from '@tanstack/react-query';

import { BtcWallet, IDerivation, Portfolio } from '@safely/core/entities';

import { portfolioKeys } from './keys';
import { usePortfoliosQuery } from './usePortfolios';
import { useSuspenseQuery } from '../../shared';

export type ActivePortfolioEntities = {
    portfolio: Portfolio;
    derivation: IDerivation;
    btcWallet: BtcWallet;
};

export function useActivePortfolioEntitiesQuery() {
    const portfoliosQuery = usePortfoliosQuery();

    return useSuspenseQuery<ActivePortfolioEntities | null>({
        queryKey: portfolioKeys.active.toKey(),
        queryFn: async () => {
            const portfolios = portfoliosQuery.data;
            if (!portfolios?.length) return null;

            // TODO: Implement actual active portfolio selection
            const portfolio = portfolios[0];
            const derivation = portfolio.derivations[0];
            const btcWallet = derivation.chains.btc.wallets[0];

            return {
                portfolio,
                derivation,
                btcWallet
            };
        },
        staleTime: Infinity,
        placeholderData: keepPreviousData
    });
}

export function useActivePortfolioEntities() {
    const { data } = useActivePortfolioEntitiesQuery();
    if (data === null) {
        throw new Error('No active portfolio');
    }

    return data;
}

export function useActivePortfolio() {
    return useActivePortfolioEntities().portfolio;
}

export function useActiveDerivation() {
    return useActivePortfolioEntities().derivation;
}

export function useActiveBtcWallet() {
    return useActivePortfolioEntities().btcWallet;
}

export function useHasPortfolio() {
    const { data: portfolios } = usePortfoliosQuery();
    const { data: activePortfolio } = useActivePortfolioEntitiesQuery();

    return activePortfolio !== null && portfolios !== null;
}
