import {
    BtcNetwork,
    BtcWallet,
    BtcWalletType,
    IDerivation,
    Id,
    Portfolio,
    PortfolioNetworkType,
    PortfolioType
} from '@safely/core';

export type ActivePortfolioEntities = {
    portfolio: Portfolio;
    derivation: IDerivation;
    btcWallet: BtcWallet;
};

class MockId extends Id {
    constructor(private readonly value: string) {
        super();
    }

    toString() {
        return this.value;
    }
}

const MOCK_PORTFOLIO_ID = new MockId('mock-portfolio-id');

const MOCK_BTC_WALLET: BtcWallet = {
    type: BtcWalletType.NATIVE_SEGWIT,
    id: new MockId('mock-btc-wallet-id') as unknown as BtcWallet['id'],
    address: 'bc1qmock1234567890abcdefghijklmnop',
    network: BtcNetwork.MAINNET,
    xpub: 'xpub6mock1234567890',
    derivationRef: null as unknown as BtcWallet['derivationRef'],
    sign: async () => Buffer.from('')
};

const MOCK_DERIVATION: IDerivation = {
    index: 0,
    id: new MockId('mock-derivation-id') as unknown as IDerivation['id'],
    chains: {
        btc: {
            wallets: [MOCK_BTC_WALLET],
            xpub: MOCK_BTC_WALLET.xpub,
            network: BtcNetwork.MAINNET,
            toJSON: () => ({
                wallets: [{ type: BtcWalletType.NATIVE_SEGWIT }],
                xpub: MOCK_BTC_WALLET.xpub
            })
        }
    },
    portfolioRef: null as unknown as IDerivation['portfolioRef'],
    toJSON: () => ({
        index: 0,
        chains: {
            btc: {
                wallets: [{ type: BtcWalletType.NATIVE_SEGWIT }],
                xpub: MOCK_BTC_WALLET.xpub
            }
        }
    })
};

export const MOCK_PORTFOLIO = {
    id: MOCK_PORTFOLIO_ID as unknown as Portfolio['id'],
    meta: {
        name: 'Main Wallet',
        icon: { type: 'emoji' as const, value: '🔒' }
    },
    type: PortfolioType.BIP39,
    networkType: PortfolioNetworkType.MAINNET,
    derivations: [MOCK_DERIVATION],
    addDerivation: async () => {},
    addNextDerivation: async () => {},
    removeDerivation: () => {},
    getDerivation: () => MOCK_DERIVATION,
    getDerivations: () => [MOCK_DERIVATION],
    updateMeta: () => {}
} as unknown as Portfolio;

const MOCK_ENTITIES: ActivePortfolioEntities = {
    portfolio: MOCK_PORTFOLIO,
    derivation: MOCK_DERIVATION,
    btcWallet: MOCK_BTC_WALLET
};

export function useActivePortfolioEntitiesQuery() {
    // const portfoliosQuery = usePortfoliosQuery();
    //
    // return useSuspenseQuery<ActivePortfolioEntities | null>({
    //     queryKey: portfolioKeys.active.toKey(),
    //     queryFn: async () => {
    //         const portfolios = portfoliosQuery.data;
    //         if (!portfolios?.length) return null;
    //
    //         const portfolio = portfolios[0];
    //         const derivation = portfolio.derivations[0];
    //         const btcWallet = derivation.chains.btc.wallets[0];
    //
    //         return { portfolio, derivation, btcWallet };
    //     },
    //     staleTime: Infinity,
    //     placeholderData: keepPreviousData
    // });
    return { data: MOCK_ENTITIES };
}

export function useActivePortfolioEntities() {
    // const { data } = useActivePortfolioEntitiesQuery();
    // if (data === null) {
    //     throw new Error('No active portfolio');
    // }
    // return data;
    return MOCK_ENTITIES;
}

export function useActivePortfolio() {
    // return useActivePortfolioEntities().portfolio;
    return MOCK_PORTFOLIO;
}

export function useActiveDerivation() {
    // return useActivePortfolioEntities().derivation;
    return MOCK_DERIVATION;
}

export function useActiveBtcWallet() {
    // TODO: Temp
    return MOCK_BTC_WALLET;
    // return useActivePortfolioEntities().btcWallet;
}

export function useHasPortfolio() {
    // const { data: portfolios } = usePortfoliosQuery();
    // const { data: activePortfolio } = useActivePortfolioEntitiesQuery();
    // return activePortfolio !== null && portfolios !== null;
    return true;
}
