import { keepPreviousData } from '@tanstack/react-query';

import { Portfolio } from '@safely/core/entities';

import { portfolioKeys } from './keys';
import { useSuspenseQuery } from '../../shared';

export function usePortfoliosQuery() {
    return useSuspenseQuery<Portfolio[] | null>({
        queryKey: portfolioKeys.all.toKey(),
        queryFn: async () => {
            // TODO: use sdk and sync
            return null;
        },
        staleTime: Infinity,
        placeholderData: keepPreviousData
    });
}

export function usePortfolios() {
    const portfolios = usePortfoliosQuery().data;
    if (!portfolios) {
        throw new Error('No portfolios found');
    }

    return portfolios;
}
