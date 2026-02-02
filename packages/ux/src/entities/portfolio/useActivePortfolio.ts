import { keepPreviousData } from '@tanstack/react-query';

import { BtcNetwork, BtcWallet, BtcWalletType, IDerivation, Portfolio } from '@safely/core';
import { Id } from '@safely/core';

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

class MockBtcWalletId extends Id {
    toString() {
        return 'mock-btc-wallet-id';
    }
}

const MOCK_BTC_WALLET: BtcWallet = {
    type: BtcWalletType.NATIVE_SEGWIT,
    id: new MockBtcWalletId() as unknown as BtcWallet['id'],
    address: 'bc1qmock1234567890abcdefghijklmnop',
    network: BtcNetwork.MAINNET,
    xpub: 'xpub6mock1234567890',
    derivationRef: null as unknown as BtcWallet['derivationRef'],
    sign: async () => Buffer.from('')
};

export function useActiveBtcWallet() {
    // TODO: Temp
    return MOCK_BTC_WALLET;
    // return useActivePortfolioEntities().btcWallet;
}

export function useHasPortfolio() {
    const { data: portfolios } = usePortfoliosQuery();
    const { data: activePortfolio } = useActivePortfolioEntitiesQuery();

    return activePortfolio !== null && portfolios !== null;
}
