import { Portfolio } from '@safely/core';

import { MOCK_PORTFOLIO } from './useActivePortfolio';

const MOCK_PORTFOLIOS: Portfolio[] = [MOCK_PORTFOLIO];

export function usePortfoliosQuery() {
    // return useSuspenseQuery<Portfolio[] | null>({
    //     queryKey: portfolioKeys.all.toKey(),
    //     queryFn: async () => {
    //         return null;
    //     },
    //     staleTime: Infinity,
    //     placeholderData: keepPreviousData
    // });
    return { data: MOCK_PORTFOLIOS };
}

export function usePortfolios() {
    // const portfolios = usePortfoliosQuery().data;
    // if (!portfolios) {
    //     throw new Error('No portfolios found');
    // }
    // return portfolios;
    return MOCK_PORTFOLIOS;
}
