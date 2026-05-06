import {
    type AccountV1,
    type AddressDerivationV1,
    type AddressMetaV1,
    type AddressSetV1,
    type AddressSourceV1,
    type AddressV1,
    type BtcChainV1,
    type ChainV1,
    type PortfolioV1,
    type WalletsV1,
    sWalletsV1
} from './v1';
import {
    type AccountV2,
    type AddressDerivationV2,
    type AddressMetaV2,
    type AddressSetV2,
    type AddressSourceV2,
    type AddressV2,
    type BtcChainV2,
    type ChainV2,
    type PortfolioV2,
    type WalletsV2,
    sWalletsV2
} from './v2';
import { projectOrderedSet } from '../../src';
import { projection } from '../../src/core/versioning/projection';

export const projectWalletsV1ToV2 = projection(sWalletsV1, sWalletsV2, wallet => ({
    portfolios: wallet.objectFrom<'portfolios', WalletsV2['portfolios']>('portfolios', portfolios =>
        projectOrderedSet<PortfolioV1, PortfolioV2>(portfolios, (_portfolioId, portfolio) => ({
            id: portfolio.copy(),
            name: portfolio.copy(),
            accounts: portfolio.objectFrom<'accounts', PortfolioV2['accounts']>(
                'accounts',
                accounts =>
                    projectOrderedSet<AccountV1, AccountV2>(accounts, (_accountId, account) => ({
                        id: account.copy(),
                        name: account.copy(),
                        chains: account.objectFrom<'chains', ChainV2>('chains', chains => ({
                            btc: chains.objectFrom<'btc', BtcChainV2>('btc', btc => ({
                                xpub: btc.copy(),
                                addresses: btc.objectFrom<'addresses', AddressSetV2>(
                                    'addresses',
                                    addresses =>
                                        projectOrderedSet<AddressV1, AddressV2>(
                                            addresses,
                                            (_addressId, address) => ({
                                                id: address.copy(),
                                                label: address.copy(),
                                                address: address.copy(),
                                                meta: address.objectFrom<'meta', AddressMetaV2>(
                                                    'meta',
                                                    meta => ({
                                                        derivation: meta.objectFrom<
                                                            'derivation',
                                                            AddressDerivationV2
                                                        >('derivation', derivation => ({
                                                            source: derivation.objectFrom<
                                                                'source',
                                                                AddressSourceV2
                                                            >('source', source => ({
                                                                path: source.copy(),
                                                                discoveredAtBlock: source.default(0)
                                                            }))
                                                        }))
                                                    })
                                                )
                                            })
                                        )
                                )
                            }))
                        }))
                    }))
            )
        }))
    )
}));

export const projectWalletsV2ToV1 = projection(sWalletsV2, sWalletsV1, wallet => ({
    portfolios: wallet.objectFrom<'portfolios', WalletsV1['portfolios']>('portfolios', portfolios =>
        projectOrderedSet<PortfolioV2, PortfolioV1>(portfolios, (_portfolioId, portfolio) => ({
            id: portfolio.copy(),
            name: portfolio.copy(),
            accounts: portfolio.objectFrom<'accounts', PortfolioV1['accounts']>(
                'accounts',
                accounts =>
                    projectOrderedSet<AccountV2, AccountV1>(accounts, (_accountId, account) => ({
                        id: account.copy(),
                        name: account.copy(),
                        chains: account.objectFrom<'chains', ChainV1>('chains', chains => ({
                            btc: chains.objectFrom<'btc', BtcChainV1>('btc', btc => ({
                                xpub: btc.copy(),
                                addresses: btc.objectFrom<'addresses', AddressSetV1>(
                                    'addresses',
                                    addresses =>
                                        projectOrderedSet<AddressV2, AddressV1>(
                                            addresses,
                                            (_addressId, address) => ({
                                                id: address.copy(),
                                                label: address.copy(),
                                                address: address.copy(),
                                                meta: address.objectFrom<'meta', AddressMetaV1>(
                                                    'meta',
                                                    meta => ({
                                                        derivation: meta.objectFrom<
                                                            'derivation',
                                                            AddressDerivationV1
                                                        >('derivation', derivation => ({
                                                            source: derivation.objectFrom<
                                                                'source',
                                                                AddressSourceV1
                                                            >('source', source => ({
                                                                path: source.copy()
                                                            }))
                                                        }))
                                                    })
                                                )
                                            })
                                        )
                                )
                            }))
                        }))
                    }))
            )
        }))
    )
}));
