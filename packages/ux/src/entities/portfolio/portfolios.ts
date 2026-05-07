import { keepPreviousData, useQueryClient } from '@tanstack/react-query';

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
    ISecretEncryptor,
    VMType
} from '@safely/core';
import { orderedIds } from '@safely/slottree';

import {
    useTranslate,
    useSuspenseQuery,
    useSecurityCheck,
    useAppContext,
    SecretEncryptor
} from '../../shared';
import { portfoliosFromOrderedSet } from '../../shared/storage/account/synced/schemas/portfolios.schema';
import { useActiveAccount, useActiveAccountQueryKey } from '../account';
import { useActiveAccountLocalStorage, useActiveAccountSyncedStorage } from '../account/storage';
import { useErrorToast } from '../errors';
import { useLogger } from '../logger';
import { useMutation } from '../query-core';
import { useToast } from '../toast';

export function usePortfoliosQuery() {
    const config = usePortfoliosQueryConfig();

    return useSuspenseQuery(config);
}

export function usePortfoliosQueryConfig() {
    const accountQueryKey = useActiveAccountQueryKey();
    const { get } = useActiveAccountSyncedStorage('portfolios');
    const account = useActiveAccount();
    const { storage } = useAppContext();

    return {
        queryKey: accountQueryKey.portfolios.toKey(),
        async queryFn() {
            const data = get();
            if (data === null) {
                return null;
            }

            return portfoliosFromOrderedSet(data).map(p =>
                PortfolioFactory.restorePortfolio(
                    new SecretEncryptor(account.secretEncryptor, storage.sync.getSecureEncrypted()),
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

export function useAddPortfolio() {
    const { update } = useActiveAccountSyncedStorage('portfolios');
    const client = useQueryClient();
    const accountQueryKey = useActiveAccountQueryKey();

    return useMutation<void, Error, Portfolio>({
        async mutationFn(portfolio) {
            const portfolioJson = portfolio.toJSON();
            const portfolioId = portfolio.id.toString();

            await update(draft => {
                if (!draft.portfolios) {
                    const portfolios = createEmptyOrderedSet<typeof portfolioJson>();
                    portfolios.setById[portfolioId] = portfolioJson;
                    rewriteOrder(portfolios, [portfolioId]);
                    (draft as { portfolios: unknown }).portfolios = portfolios;
                    return;
                }

                const portfolios = draft.portfolios as unknown as MutableOrderedSet<
                    typeof portfolioJson
                >;

                if (portfolios.setById[portfolioId]) {
                    throw new PortfolioAlreadyExistsError();
                }

                portfolios.setById[portfolioId] = portfolioJson;
                rewriteOrder(portfolios, [...sortByCurrentOrder(portfolios), portfolioId]);
            });
            await client.invalidateQueries({ queryKey: accountQueryKey.portfolios.toKey() });
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
        { meta: PortfolioMeta; secretEncryptor: ISecretEncryptor },
        unknown
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
        },
        unknown
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
    const { update } = useActiveAccountSyncedStorage('portfolios');
    const client = useQueryClient();
    const accountQueryKey = useActiveAccountQueryKey();
    const check = useSecurityCheck();

    return useMutation<void, Error, { id: IPortfolioId }>({
        async mutationFn({ id }) {
            await check();
            const portfolioId = id.toString();

            await update(draft => {
                if (!draft.portfolios) {
                    return;
                }

                const portfolios = draft.portfolios as MutableOrderedSet<unknown>;
                delete portfolios.setById[portfolioId];
                delete portfolios.setOrder[portfolioId];
                rewriteOrder(portfolios, sortByCurrentOrder(portfolios));
            });
            await client.invalidateQueries({ queryKey: accountQueryKey.portfolios.toKey() });
        }
    });
}

export function useReorderPortfolios() {
    const { update } = useActiveAccountSyncedStorage('portfolios');
    const client = useQueryClient();
    const accountQueryKey = useActiveAccountQueryKey();

    return useMutation<void, Error, Portfolio[]>({
        onMutate(nextPortfoliosOrder) {
            client.setQueryData(accountQueryKey.portfolios.toKey(), nextPortfoliosOrder);
        },
        async mutationFn(nextPortfoliosOrder) {
            const nextIds = nextPortfoliosOrder.map(portfolio => portfolio.id.toString());

            await update(draft => {
                if (!draft.portfolios) {
                    return;
                }

                const portfolios = draft.portfolios as MutableOrderedSet<unknown>;
                const existingNextIds = nextIds.filter(id => portfolios.setById[id] !== undefined);
                const remainingIds = sortByCurrentOrder(portfolios).filter(
                    id => !existingNextIds.includes(id)
                );

                rewriteOrder(portfolios, [...existingNextIds, ...remainingIds]);
            });
            await client.invalidateQueries({ queryKey: accountQueryKey.portfolios.toKey() });
        }
    });
}

export function useAddBip39Derivation() {
    const portfolio = useActivePortfolio();
    const { update } = useActiveAccountSyncedStorage('portfolios');
    const client = useQueryClient();
    const accountQueryKey = useActiveAccountQueryKey();

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

            const portfolioJson = portfolio.toJSON();
            const portfolioId = portfolio.id.toString();

            await update(draft => {
                const stored = draft.portfolios?.setById[portfolioId];
                if (!stored || stored.type !== PortfolioType.BIP39) {
                    throw new Error('Portfolio not found or not derivable');
                }

                stored.derivations = portfolioJson.derivations;
            });
            await client.invalidateQueries({ queryKey: accountQueryKey.portfolios.toKey() });
        }
    });
}

export function useRemoveBip39Derivation() {
    const portfolio = useActivePortfolio();
    const { update } = useActiveAccountSyncedStorage('portfolios');
    const client = useQueryClient();
    const accountQueryKey = useActiveAccountQueryKey();

    return useMutation<void, Error, { index: number }>({
        async mutationFn({ index }) {
            if (portfolio.type !== PortfolioType.BIP39) {
                throw new Error('Derivation can be removed only to bip39 wallet');
            }

            portfolio.removeDerivation(index);

            const portfolioJson = portfolio.toJSON();
            const portfolioId = portfolio.id.toString();

            await update(draft => {
                const stored = draft.portfolios?.setById[portfolioId];
                if (!stored || stored.type !== PortfolioType.BIP39) {
                    throw new Error('Portfolio not found or not derivable');
                }

                stored.derivations = portfolioJson.derivations;
            });
            await client.invalidateQueries({ queryKey: accountQueryKey.portfolios.toKey() });
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
};

type ActivePortfolioEntities = ActivePortfolioEntitiesBip39 | ActivePortfolioEntitiesWatchOnly;

type MutableOrderedSet<T> = {
    setById: Record<string, T>;
    setOrder: Record<string, number>;
};

function createEmptyOrderedSet<T>(): MutableOrderedSet<T> {
    return { setById: {}, setOrder: {} };
}

function rewriteOrder<T>(set: MutableOrderedSet<T>, ids: string[]) {
    const nextIds = new Set(ids);
    for (const id of Object.keys(set.setOrder)) {
        if (!nextIds.has(id)) {
            delete set.setOrder[id];
        }
    }

    ids.forEach((id, index) => {
        set.setOrder[id] = index;
    });
}

function sortByCurrentOrder<T>(set: MutableOrderedSet<T>): string[] {
    return orderedIds(set);
}

export function useActivePortfolioEntitiesQuery() {
    const { get, set } = useActiveAccountLocalStorage('activePortfolio');
    const accountQueryKey = useActiveAccountQueryKey();
    const client = useQueryClient();
    const portfoliosQuery = usePortfoliosQueryConfig();
    const logger = useLogger();

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
                    await set({ portfolioId: portfolio.id.toString(), derivationId: null });

                    return {
                        kind: 'watch-only',
                        portfolio
                    };
                }

                if (activeConfig && !activeConfig.derivationId) {
                    logger.error('derivationId is null for derivable portfolio');
                }

                const derivation = activeConfig?.derivationId
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
                meta,
                vmType: VMType.BTC
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
    const { set } = useActiveAccountLocalStorage('activePortfolio');
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
    const { set } = useActiveAccountLocalStorage('activePortfolio');
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
                    : null;

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
    const accountQueryKey = useActiveAccountQueryKey();
    const { update } = useActiveAccountSyncedStorage('portfolios');

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

            const portfolioId = id.toString();
            await update(draft => {
                const stored = draft.portfolios?.setById[portfolioId];
                if (!stored) {
                    throw new Error('Portfolio not found');
                }

                stored.meta = { ...stored.meta, ...meta };
            });
            await client.invalidateQueries({ queryKey: accountQueryKey.portfolios.toKey() });

            portfolio.updateMeta(meta);
            return portfolio;
        }
    });
}

export function useRecordActivePortfolioSecretReveal() {
    const client = useQueryClient();
    const activePortfolio = useActivePortfolio();
    const accountQueryKey = useActiveAccountQueryKey();
    const { update } = useActiveAccountSyncedStorage('portfolios');
    const { deviceInfo } = useAppContext();

    return useMutation({
        async mutationFn() {
            if (activePortfolio.type !== PortfolioType.BIP39) {
                return;
            }

            const revealedAt = Date.now();
            const portfolioId = activePortfolio.id.toString();

            await update(draft => {
                const stored = draft.portfolios?.setById[portfolioId];
                if (!stored || stored.type !== PortfolioType.BIP39) {
                    return;
                }

                stored.secretRevealedStatus = {
                    revealedAt,
                    revealedFromDevice: deviceInfo.name
                };
            });
            await client.invalidateQueries({ queryKey: accountQueryKey.portfolios.toKey() });
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
    return resolveBtcWallet(useActivePortfolioEntities().portfolio);
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
    return portfolios?.find(p => resolveBtcWallet(p).address === address)?.meta;
}

export function resolveBtcWallet(portfolio: Portfolio): BtcWalletReadOnly {
    if (portfolio.type === PortfolioType.WATCH_ONLY) {
        return portfolio.wallet;
    }

    return portfolio.derivations[0].chains.btc.wallets[0];
}

export function getPortfolioDisplayName(meta: PortfolioMeta): string {
    if (meta.icon.type === 'emoji') {
        return `${meta.icon.value} ${meta.name}`;
    }

    return meta.name;
}
