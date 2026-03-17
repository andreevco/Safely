import { keepPreviousData, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import {
    BtcWallet,
    delay,
    Id,
    IDerivation,
    IMnemonicAccessor,
    Portfolio,
    PortfolioAlreadyExistsError,
    PortfolioBip39,
    PortfolioFactory,
    PortfolioMeta,
    PortfolioNetworkType,
    PortfolioType,
    IPortfolioId,
    generateBip39Accessor
} from '@safely/core';

import {
    useTranslate,
    useErrorToast,
    useSuspenseQuery,
    useAccountLocalStorage,
    useSecurityCheck,
    useAppContext
} from '../../shared';
import { useActiveAccountSyncedStorage } from '../../shared/storage/account/synced';
import { useActiveAccount, useActiveAccountQueryKey } from '../account';
import { useToast } from '../toast';

export function usePortfoliosQuery() {
    const config = usePortfoliosQueryConfig();

    return useSuspenseQuery(config);
}

export function usePortfoliosFactory() {
    const account = useActiveAccount();
    return useMemo(() => new PortfolioFactory(account.secretEncryptor), [account.secretEncryptor]);
}

export function usePortfoliosQueryConfig() {
    const accountQueryKey = useActiveAccountQueryKey();
    const { get } = useActiveAccountSyncedStorage('portfolios');
    const account = useActiveAccount();

    return {
        queryKey: accountQueryKey.portfolios.toKey(),
        async queryFn() {
            const data = await get();
            if (data === null) {
                return null;
            }

            return data.map(a => PortfolioFactory.restorePortfolio(account.secretEncryptor, a));
        },
        staleTime: Infinity,
        placeholderData: keepPreviousData
    };
}

export function usePortfolios() {
    const portfolios = usePortfoliosQuery().data;
    if (!portfolios) {
        throw new Error('Unexpected portfolios query');
    }

    return portfolios;
}

function useSetPortfolios() {
    const { set } = useActiveAccountSyncedStorage('portfolios');
    const client = useQueryClient();
    const accountQueryKey = useActiveAccountQueryKey();

    return useMutation<void, Error, Portfolio[]>({
        async mutationFn(accounts) {
            await set(accounts.map(a => a.toJSON()));
            await client.invalidateQueries({ queryKey: accountQueryKey.portfolios.toKey() });
        }
    });
}

export function useAddPortfolio() {
    const { mutateAsync } = useSetPortfolios();
    const { data: accounts } = usePortfoliosQuery();

    return useMutation<void, Error, Portfolio>({
        async mutationFn(account) {
            await mutateAsync((accounts ?? []).concat(account));
        }
    });
}

export function useNewPortfolioFallbackName() {
    const { data: portfolios } = usePortfoliosQuery();
    const t = useTranslate();

    const portfoliosCount = portfolios?.length ?? 0;

    return t('security.groups.wallet.defaultName', { number: portfoliosCount + 1 });
}

export function useGeneratePortfolio() {
    const { mutateAsync: setActivePortfolio } = useSetActivePortfolio();
    const { mutateAsync: addAccount } = useAddPortfolio();
    const fallbackName = useNewPortfolioFallbackName();
    const errorToast = useErrorToast({
        PortfolioGenerationFailedError: 'importWalletScreen.errors.failedToGenerate'
    });
    const factory = usePortfoliosFactory();

    return useMutation<PortfolioBip39, Error, Partial<PortfolioMeta> | void>({
        async mutationFn(params) {
            await delay();
            using accessorVault = generateBip39Accessor();

            const portfolio = await factory.generatePortfolioBip39(accessorVault, {
                network: PortfolioNetworkType.MAINNET,
                name: params?.name ?? fallbackName
            });

            if (params?.icon) {
                portfolio.updateMeta({ icon: params.icon });
            }

            await addAccount(portfolio);

            await setActivePortfolio(portfolio);

            return portfolio;
        },
        onError: errorToast
    });
}

export function useImportPortfolio() {
    const { data: existingPortfolios } = usePortfoliosQuery();
    const name = useNewPortfolioFallbackName();
    const { mutateAsync: addPortfolio } = useAddPortfolio();
    const { mutateAsync: setActivePortfolio } = useSetActivePortfolio();
    const toast = useToast();
    const t = useTranslate();
    const errorToast = useErrorToast({
        InvalidMnemonicError: 'importWalletScreen.errors.invalidMnemonic',
        PortfolioAlreadyExistsError: 'importWalletScreen.errors.alreadyExists'
    });
    const factory = usePortfoliosFactory();
    const { deviceInfo } = useAppContext();

    return useMutation<Portfolio, Error, IMnemonicAccessor>({
        async mutationFn(accessor) {
            await delay();

            const portfolio = await factory.generatePortfolio(accessor, {
                network: PortfolioNetworkType.MAINNET,
                name,
                seedRevealedFromDevice: deviceInfo.name
            });

            if (existingPortfolios?.some(p => p.id.isEq(portfolio.id))) {
                throw new PortfolioAlreadyExistsError();
            }

            await addPortfolio(portfolio);

            await setActivePortfolio(portfolio);

            return portfolio;
        },
        onSuccess() {
            toast(t('importWalletScreen.toastMessages.importedWallet'));
        },
        onError: errorToast
    });
}

export function useDeletePortfolio() {
    const portfolios = usePortfolios();
    const { mutateAsync } = useSetPortfolios();
    const check = useSecurityCheck();

    return useMutation<void, Error, { id: IPortfolioId }>({
        async mutationFn({ id }) {
            if (portfolios.length === 1) {
                throw new Error('Cannot delete last portfolio');
            }
            await check();
            await mutateAsync(portfolios.filter(p => !p.id.isEq(id)));
        }
    });
}

export function useReorderPortfolios() {
    const { mutateAsync } = useSetPortfolios();
    const client = useQueryClient();
    const accountQueryKey = useActiveAccountQueryKey();

    return useMutation<void, Error, Portfolio[]>({
        onMutate(nextPortfoliosOrder) {
            client.setQueryData(accountQueryKey.portfolios.toKey(), nextPortfoliosOrder);
        },
        async mutationFn(nextPortfoliosOrder) {
            await mutateAsync(nextPortfoliosOrder);
        }
    });
}

export function useAddBip39Derivation() {
    const portfolio = useActivePortfolio();
    const portfolios = usePortfolios();
    const { mutateAsync } = useSetPortfolios();

    return useMutation<void, Error, { index: number | undefined }>({
        async mutationFn({ index }) {
            if (portfolio.type !== PortfolioType.BIP39) {
                throw new Error('Derivation can be added only to bip39 portfolio');
            }

            if (index === undefined) {
                await portfolio.addNextDerivation();
            } else {
                await portfolio.addDerivation(index);
            }

            await mutateAsync(portfolios);
        }
    });
}

export function useRemoveBip39Derivation() {
    const portfolio = useActivePortfolio();
    const portfolios = usePortfolios();
    const { mutateAsync } = useSetPortfolios();

    return useMutation<void, Error, { index: number }>({
        async mutationFn({ index }) {
            if (portfolio.type !== PortfolioType.BIP39) {
                throw new Error('Derivation can be removed only to bip39 wallet');
            }

            portfolio.removeDerivation(index);

            await mutateAsync(portfolios);
        }
    });
}

type ActivePortfolioBip39Entities = {
    portfolio: PortfolioBip39;
    derivation: IDerivation;
    chains: {
        btc: BtcWallet;
    };
};

type ActivePortfolioEntities = ActivePortfolioBip39Entities;

export function useActivePortfolioEntitiesQuery() {
    const { get, set } = useAccountLocalStorage('activePortfolio');
    const accountQueryKey = useActiveAccountQueryKey();
    const client = useQueryClient();
    const portfoliosQuery = usePortfoliosQueryConfig();

    return useSuspenseQuery<ActivePortfolioEntities | null>({
        queryKey: accountQueryKey.portfolios.active.toKey(),
        async queryFn() {
            const portfolios: ReturnType<typeof usePortfoliosQuery>['data'] =
                await client.fetchQuery(portfoliosQuery);
            if (!portfolios?.length) {
                return null;
            }

            const activeConfig = await get();

            const getFallbackPortfolioEntities = async (
                portfolioToSet?: Portfolio,
                derivationToSet?: IDerivation,
                chains?: {
                    btc: BtcWallet | undefined;
                }
            ) => {
                portfolioToSet ??= portfolios[0];
                derivationToSet ??= portfolioToSet.getDerivations()[0];

                const chainWallets = {
                    btc: chains?.btc ?? derivationToSet.chains.btc.wallets[0]
                };

                const derivationId = derivationToSet.id.toString();

                await set({
                    portfolioId: portfolioToSet.id.toString(),
                    derivationId
                });

                return {
                    portfolio: portfolioToSet,
                    derivation: derivationToSet,
                    chains: chainWallets
                };
            };

            if (!activeConfig) {
                return getFallbackPortfolioEntities();
            }

            const activePortfolio = portfolios.find(p =>
                p.id.isEq(Id.fromString(activeConfig.portfolioId))
            );

            if (!activePortfolio) {
                return getFallbackPortfolioEntities();
            }

            const derivation = activePortfolio.getDerivation(
                Id.fromString(activeConfig.derivationId)
            );
            if (!derivation) {
                return getFallbackPortfolioEntities(activePortfolio);
            }

            const btcWallet = derivation.chains.btc.wallets[0];

            return {
                portfolio: activePortfolio,
                derivation,
                chains: {
                    btc: btcWallet
                }
            } as ActivePortfolioEntities;
        },
        staleTime: Infinity,
        placeholderData: keepPreviousData
    });
}

export function useHasPortfolio() {
    return !!useActivePortfolioEntitiesQuery().data?.portfolio;
}

export function useSetActiveDerivation() {
    const { set } = useAccountLocalStorage('activePortfolio');
    const client = useQueryClient();
    const portfoliosQuery = usePortfoliosQueryConfig();
    const accountQueryKey = useActiveAccountQueryKey();

    return useMutation<Portfolio, Error, Pick<IDerivation, 'id'>>({
        async mutationFn({ id }) {
            const portfolios: Portfolio[] = await client.fetchQuery(portfoliosQuery);
            const portfolioToSet = portfolios.find(a => a.id.isEq(id.portfolioId));
            const derivationToSet = portfolioToSet?.getDerivation(id);

            if (!portfolioToSet || !derivationToSet) {
                throw new Error('Portfolio not found');
            }

            const derivationId = portfolioToSet.id.toString();

            await set({
                portfolioId: portfolioToSet.id.toString(),
                derivationId
            });

            await client.invalidateQueries({
                queryKey: accountQueryKey.portfolios.toKey()
            });

            return portfolioToSet;
        }
    });
}

export function useSetActivePortfolio() {
    const { mutateAsync } = useSetActiveDerivation();
    const portfoliosQuery = usePortfoliosQueryConfig();
    const client = useQueryClient();

    return useMutation<Portfolio, Error, Pick<Portfolio, 'id'>>({
        async mutationFn({ id }) {
            const portfolios: Portfolio[] = await client.fetchQuery(portfoliosQuery);
            const portfolioToSet = portfolios.find(a => a.id.isEq(id));
            const derivationToSet = portfolioToSet?.getDerivations()[0];

            if (!portfolioToSet || !derivationToSet) {
                throw new Error('Account not found');
            }

            await mutateAsync(derivationToSet);

            return portfolioToSet;
        }
    });
}

export function useChangePortfolioMeta() {
    const client = useQueryClient();
    const portfoliosQuery = usePortfoliosQueryConfig();
    const { mutateAsync } = useSetPortfolios();

    return useMutation<
        Portfolio,
        Error,
        { portfolio: { id: IPortfolioId }; meta: Partial<PortfolioMeta> }
    >({
        async mutationFn({ portfolio: { id }, meta }) {
            const portfolios: Portfolio[] = await client.fetchQuery(portfoliosQuery);
            const portfolio = portfolios.find(p => p.id.isEq(id));
            if (!portfolio) {
                throw new Error('Portfolio not found');
            }

            portfolio.updateMeta(meta);
            await mutateAsync(portfolios);
            return portfolio;
        }
    });
}

export function useRecordActivePortfolioSecretReveal() {
    const client = useQueryClient();
    const portfoliosQuery = usePortfoliosQueryConfig();
    const activePortfolio = useActivePortfolio();
    const { mutateAsync } = useSetPortfolios();
    const { deviceInfo } = useAppContext();

    return useMutation({
        async mutationFn() {
            if (activePortfolio.secretRevealedStatus === null) {
                return;
            }

            const portfolios: Portfolio[] = await client.fetchQuery(portfoliosQuery);
            const portfolio = portfolios.find(p => p.id.isEq(activePortfolio.id));
            if (!portfolio) {
                throw new Error('Portfolio not found');
            }
            portfolio.recordSecretReveal(deviceInfo.name);
            await mutateAsync(portfolios);
        }
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
    return useActivePortfolioEntities().chains.btc;
}

export function findPortfolioMetaByAddress(
    portfolios: ReturnType<typeof usePortfolios>,
    address: string
): PortfolioMeta | undefined {
    return portfolios?.find(p =>
        p.getDerivations().some(d => d.chains.btc.wallets[0]?.address === address)
    )?.meta;
}
