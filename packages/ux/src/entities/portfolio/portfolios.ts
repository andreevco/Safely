import { keepPreviousData, useMutation, useQueryClient } from '@tanstack/react-query';

import {
    BtcWalletReadOnly,
    SignableBtcWallet,
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
    PortfolioWatchOnly,
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

type ActivePortfolioEntitiesBip39 = {
    kind: 'bip39';
    portfolio: PortfolioBip39;
    btcWallet: SignableBtcWallet;
    derivation: IDerivation;
};

type ActivePortfolioEntitiesWatchOnly = {
    kind: 'watch-only';
    portfolio: PortfolioWatchOnly;
    btcWallet: BtcWalletReadOnly;
};

type ActivePortfolioEntities = ActivePortfolioEntitiesBip39 | ActivePortfolioEntitiesWatchOnly;

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

            const resolveEntities = async (
                portfolio: Portfolio
            ): Promise<ActivePortfolioEntities> => {
                if (portfolio.type === PortfolioType.WATCH_ONLY) {
                    await set({ portfolioId: portfolio.id.toString(), derivationId: '' });

                    return {
                        kind: 'watch-only',
                        portfolio,
                        btcWallet: portfolio.btcWallet
                    };
                }

                const derivation = activeConfig
                    ? (portfolio.getDerivation(Id.fromString(activeConfig.derivationId)) ??
                      portfolio.getDerivations()[0])
                    : portfolio.getDerivations()[0];

                await set({
                    portfolioId: portfolio.id.toString(),
                    derivationId: derivation.id.toString()
                });

                return {
                    kind: 'bip39',
                    portfolio,
                    btcWallet: derivation.chains.btc.wallets[0],
                    derivation
                };
            };

            if (!activeConfig) {
                return resolveEntities(portfolios[0]);
            }

            const activePortfolio = portfolios.find(p =>
                p.id.isEq(Id.fromString(activeConfig.portfolioId))
            );

            if (!activePortfolio) {
                return resolveEntities(portfolios[0]);
            }

            return resolveEntities(activePortfolio);
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

    return entities?.kind === 'watch-only';
}

export function useAddWatchOnlyPortfolio() {
    const client = useQueryClient();
    const portfoliosQuery = usePortfoliosQueryConfig();
    const { mutateAsync: addPortfolio } = useAddPortfolio();
    const { mutateAsync: setActivePortfolio } = useSetActivePortfolio();

    return useMutation<Portfolio, Error, { input: string; meta: PortfolioMeta }>({
        async mutationFn({ input, meta }) {
            const portfolio = PortfolioFactory.generateWatchOnlyPortfolio(input, {
                network: PortfolioNetworkType.MAINNET,
                meta
            });

            const portfolios: Portfolio[] = await client.fetchQuery(portfoliosQuery);

            const existing = portfolios.find(p => p.id.isEq(portfolio.id));
            if (existing) {
                throw new PortfolioAlreadyExistsError(existing);
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

            if (!portfolioToSet || portfolioToSet.type !== PortfolioType.BIP39) {
                throw new Error('Portfolio not found or not derivable');
            }

            const derivationToSet = portfolioToSet.getDerivation(id);

            if (!derivationToSet) {
                throw new Error('Derivation not found');
            }

            await set({
                portfolioId: portfolioToSet.id.toString(),
                derivationId: derivationToSet.id.toString()
            });

            await client.invalidateQueries({
                queryKey: accountQueryKey.portfolios.toKey()
            });

            return portfolioToSet;
        }
    });
}

export function useSetActivePortfolio() {
    const { set } = useAccountLocalStorage('activePortfolio');
    const portfoliosQuery = usePortfoliosQueryConfig();
    const client = useQueryClient();
    const accountQueryKey = useActiveAccountQueryKey();

    return useMutation<Portfolio, Error, Pick<Portfolio, 'id'>>({
        async mutationFn({ id }) {
            const portfolios: Portfolio[] = await client.fetchQuery(portfoliosQuery);
            const portfolioToSet = portfolios.find(a => a.id.isEq(id));

            if (!portfolioToSet) {
                throw new Error('Portfolio not found');
            }

            const derivationId =
                portfolioToSet.type === PortfolioType.BIP39
                    ? portfolioToSet.getDerivations()[0].id.toString()
                    : '';

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
            if (activePortfolio.type !== PortfolioType.BIP39) {
                return;
            }

            const portfolios: Portfolio[] = await client.fetchQuery(portfoliosQuery);
            const portfolio = portfolios.find(p => p.id.isEq(activePortfolio.id));
            if (!portfolio || portfolio.type !== PortfolioType.BIP39) {
                return;
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

export function useActiveBtcWallet(): BtcWalletReadOnly {
    return useActivePortfolioEntities().btcWallet;
}

export function useActiveSignableBtcWallet(): SignableBtcWallet {
    const entities = useActivePortfolioEntities();

    if (entities.kind !== 'bip39') {
        throw new Error('Signable wallet unavailable for watch-only portfolio');
    }

    return entities.btcWallet;
}

export function findPortfolioMetaByAddress(
    portfolios: ReturnType<typeof usePortfolios>,
    address: string
): PortfolioMeta | undefined {
    return portfolios?.find(p => p.getBtcWallet().address === address)?.meta;
}
