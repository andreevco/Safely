import { keepPreviousData, useMutation, useQueryClient } from '@tanstack/react-query';

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
    generateBip39Accessor,
    ISecretEncryptor
} from '@safely/core';

import {
    useTranslate,
    useErrorToast,
    useSuspenseQuery,
    useAccountLocalStorage,
    useSecurityCheck,
    useAppContext,
    SecretEncryptor
} from '../../shared';
import { useActiveAccountSyncedStorage } from '../../shared/storage/account/synced';
import { useActiveAccount, useActiveAccountQueryKey } from '../account';
import { useToast } from '../toast';

export function usePortfoliosQuery() {
    const config = usePortfoliosQueryConfig();

    return useSuspenseQuery(config);
}

export function usePortfoliosQueryConfig() {
    const accountQueryKey = useActiveAccountQueryKey();
    const { get } = useActiveAccountSyncedStorage('portfolios');
    const account = useActiveAccount();
    const { getSecureEncryptedStorage } = useAppContext();

    return {
        queryKey: accountQueryKey.portfolios.toKey(),
        async queryFn() {
            const data = get();
            if (data === null) {
                return null;
            }

            return data.map(p =>
                PortfolioFactory.restorePortfolio(
                    new SecretEncryptor(account.secretEncryptor, getSecureEncryptedStorage()),
                    p
                )
            );
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

    const errorToast = useErrorToast({
        PortfolioGenerationFailedError: 'importWalletScreen.errors.failedToGenerate'
    });

    return useMutation<
        PortfolioBip39,
        Error,
        { meta: PortfolioMeta; secretEncryptor: ISecretEncryptor }
    >({
        async mutationFn(params) {
            await delay();

            using accessorVault = generateBip39Accessor();
            const factory = new PortfolioFactory(params.secretEncryptor);

            const portfolio = await factory.generatePortfolioBip39(accessorVault, {
                network: PortfolioNetworkType.MAINNET,
                meta: params.meta
            });

            await addAccount(portfolio);

            await setActivePortfolio(portfolio);

            return portfolio;
        },
        onError: errorToast
    });
}

export function useImportPortfolio() {
    const { data: existingPortfolios } = usePortfoliosQuery();
    const { mutateAsync: addPortfolio } = useAddPortfolio();
    const { mutateAsync: setActivePortfolio } = useSetActivePortfolio();
    const toast = useToast();
    const t = useTranslate();
    const errorToast = useErrorToast({
        InvalidMnemonicError: 'importWalletScreen.errors.invalidMnemonic'
    });
    const { deviceInfo } = useAppContext();

    return useMutation<
        Portfolio,
        Error,
        {
            mnemonicAccessor: IMnemonicAccessor;
            secretEncryptor: ISecretEncryptor;
            meta: PortfolioMeta;
        }
    >({
        async mutationFn({ mnemonicAccessor, secretEncryptor, meta }) {
            await delay();

            const factory = new PortfolioFactory(secretEncryptor);

            const portfolio = await factory.generatePortfolio(mnemonicAccessor, {
                network: PortfolioNetworkType.MAINNET,
                meta,
                seedRevealedFromDevice: deviceInfo.name
            });

            const existingBip39 = existingPortfolios?.find(p => p.id.isEq(portfolio.id));

            if (existingBip39) {
                throw new PortfolioAlreadyExistsError(existingBip39);
            }

            await addPortfolio(portfolio);

            await setActivePortfolio(portfolio);

            return portfolio;
        },
        onSuccess() {
            toast(t('importWalletScreen.toastMessages.importedWallet'));
        },
        onError(error) {
            if (error instanceof PortfolioAlreadyExistsError) {
                return;
            }

            errorToast(error);
        }
    });
}

export function useDeletePortfolio() {
    const portfolios = usePortfolios();
    const { mutateAsync } = useSetPortfolios();
    const check = useSecurityCheck();

    return useMutation<void, Error, { id: IPortfolioId }>({
        async mutationFn({ id }) {
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

type ActivePortfolioEntities = {
    portfolio: Portfolio;
    derivation: IDerivation;
    chains: {
        btc: BtcWallet;
    };
};

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
    const { data: active } = useActivePortfolioEntitiesQuery();

    return active !== null;
}

export function useIsActiveWalletWatchOnly(): boolean {
    const entities = useActivePortfolioEntitiesQuery().data;

    return entities?.portfolio.id.type === PortfolioType.WATCH_ONLY;
}

export function useAddWatchOnlyPortfolio() {
    const { data: existingPortfolios } = usePortfoliosQuery();
    const { mutateAsync: addPortfolio } = useAddPortfolio();
    const { mutateAsync: setActivePortfolio } = useSetActivePortfolio();

    return useMutation<Portfolio, Error, { address: string; meta: PortfolioMeta }>({
        async mutationFn({ address, meta }) {
            const portfolio = PortfolioFactory.generateWatchOnlyPortfolio(address, {
                network: PortfolioNetworkType.MAINNET,
                meta
            });

            const existingWatchOnly = existingPortfolios?.find(
                p =>
                    p.id.type === PortfolioType.WATCH_ONLY &&
                    p
                        .getDerivations()
                        .some(d => d.chains.btc.wallets.some(w => w.address === address))
            );

            if (existingWatchOnly) {
                throw new PortfolioAlreadyExistsError(existingWatchOnly);
            }

            await addPortfolio(portfolio);
            await setActivePortfolio(portfolio);

            return portfolio;
        }
    });
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
