import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import type {
    BtcWalletReadOnly,
    SignableBtcWallet,
    IDerivation,
    IMnemonicAccessor,
    Portfolio,
    PortfolioBip39,
    PortfolioMeta,
    PortfolioWatchOnly,
    ISecretEncryptor
} from '@safely/core';
import {
    delay,
    Id,
    PortfolioAlreadyExistsError,
    PortfolioFactory,
    PortfolioNetworkType,
    PortfolioType,
    VM_TYPE
} from '@safely/core';

import { useTranslate, useSecurityCheck, useAppContext } from '../../shared';
import { useSuspenseQuery } from '../../shared';
import type { SActivePortfolioSchema, UseAccountSyncStorageUpdateOptions } from '../account';
import { useActiveAccountSyncStorageSlotUpdate } from '../account';
import { useActiveAccountStoreSlot } from '../account';
import {
    useActiveAccountLocalStorage,
    useActiveAccountQuery,
    useActiveAccountQueryKey
} from '../account';
import { useErrorToast } from '../errors';
import { useMutation } from '../query-core';
import { useToast } from '../toast';
import { WalletSeedFactory } from '../wallet-seed';

const EMPTY_PORTFOLIOS: Portfolio[] = Object.freeze([]) as unknown as Portfolio[];

export function usePortfolios(): Portfolio[] {
    return useActiveAccountStoreSlot('portfolios') ?? EMPTY_PORTFOLIOS;
}

export function useAddPortfolio(options?: UseAccountSyncStorageUpdateOptions) {
    const update = useActiveAccountSyncStorageSlotUpdate('portfolios', options);

    return useMutation<void, Error, Portfolio>({
        async mutationFn(portfolio) {
            return update(draft => draft.push(portfolio.toJSON()));
        }
    });
}

export function useNewPortfolioFallbackName() {
    const portfolios = usePortfolios();
    const t = useTranslate();

    return t('security.groups.wallet.defaultName', { number: portfolios.length + 1 });
}

export function useGeneratePortfolio() {
    const { mutateAsync: setActivePortfolio } = useSetActivePortfolio();
    const { mutateAsync: addAccount } = useAddPortfolio({ showErrorToast: false });
    const { data: account } = useActiveAccountQuery();

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

            if (!account) {
                throw new Error('Cannot generate portfolio without active account');
            }

            const walletSeedFactory = new WalletSeedFactory(account.syncProvider);
            using accessorVault = await walletSeedFactory.generateBip39SeedAccessor(
                params.secretEncryptor
            );
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
    const { mutateAsync: addPortfolio } = useAddPortfolio({ showErrorToast: false });
    const { mutateAsync: setActivePortfolio } = useSetActivePortfolio();
    const toast = useToast();
    const t = useTranslate();
    const errorToast = useErrorToast({
        InvalidMnemonicError: 'importWalletScreen.errors.invalidMnemonic'
    });
    const { deviceInfo } = useAppContext();
    const portfolios = usePortfolios();

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

            const existingBip39 = portfolios.find(p => p.id.isEq(portfolio.id));

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
    const update = useActiveAccountSyncStorageSlotUpdate('portfolios');
    const check = useSecurityCheck();

    return useMutation<void, Error, Portfolio>({
        async mutationFn(portfolio) {
            await check();
            await update(draft => draft.remove(portfolio.jsonArrayId()));
        }
    });
}

export function useReorderPortfolios() {
    const update = useActiveAccountSyncStorageSlotUpdate('portfolios');

    return useMutation<void, Error, Portfolio[]>({
        async mutationFn(nextPortfoliosOrder) {
            await update(draft => draft.reorder(nextPortfoliosOrder.map(p => p.jsonArrayId())));
        }
    });
}

type ActivePortfolioEntitiesBip39 = {
    type: 'bip39';
    portfolio: PortfolioBip39;
    btcWallet: SignableBtcWallet;
    derivation: IDerivation;
};

type ActivePortfolioEntitiesWatchOnly = {
    type: 'watch-only';
    portfolio: PortfolioWatchOnly;
};

type ActivePortfolioEntities = ActivePortfolioEntitiesBip39 | ActivePortfolioEntitiesWatchOnly;

export function useActivePortfolioEntitiesIdsQuery<TData = SActivePortfolioSchema>(
    select?: (data: SActivePortfolioSchema) => TData
) {
    const { get } = useActiveAccountLocalStorage('activePortfolio');
    const accountQueryKey = useActiveAccountQueryKey();
    const { data: activeAccount } = useActiveAccountQuery();

    return useSuspenseQuery<SActivePortfolioSchema, unknown, TData>({
        queryKey: accountQueryKey.activePortfolio.toKey(),
        async queryFn() {
            if (!activeAccount) return null;
            return get();
        },
        staleTime: Infinity,
        select
    });
}

export function useActivePortfolioEntitiesQuery() {
    const portfolios = usePortfolios();

    return useActivePortfolioEntitiesIdsQuery<ActivePortfolioEntities | null>(
        useCallback(
            (sActivePortfolioSchema: SActivePortfolioSchema) => {
                if (portfolios.length === 0) return null;

                let portfolio: Portfolio;
                if (sActivePortfolioSchema) {
                    portfolio =
                        portfolios.find(p =>
                            p.id.isEq(Id.fromString(sActivePortfolioSchema.portfolioId))
                        ) ?? portfolios[0];
                } else {
                    portfolio = portfolios[0];
                }

                if (portfolio.type === PortfolioType.WATCH_ONLY) {
                    return { type: 'watch-only' as const, portfolio };
                }

                const derivation = portfolio.getDerivations()[0];

                return {
                    type: 'bip39' as const,
                    portfolio,
                    btcWallet: derivation.chains.btc.wallets[0],
                    derivation
                };
            },
            [portfolios]
        )
    );
}

export function useActivePortfolioEntities(): ActivePortfolioEntities {
    const entities = useActivePortfolioEntitiesQuery().data;
    if (entities === null) {
        throw new Error('No active portfolio');
    }
    return entities;
}

export function useHasPortfolio() {
    return useActivePortfolioEntitiesQuery().data !== null;
}

export function useIsActiveWalletWatchOnly(): boolean {
    return useActivePortfolioEntitiesQuery()?.data?.type === 'watch-only';
}

export function useAddWatchOnlyPortfolio() {
    const { mutateAsync: addPortfolio } = useAddPortfolio();
    const { mutateAsync: setActivePortfolio } = useSetActivePortfolio();
    const portfolios = usePortfolios();

    return useMutation<Portfolio, Error, { input: string; meta: PortfolioMeta }>({
        async mutationFn({ input, meta }) {
            const portfolio = PortfolioFactory.generateWatchOnlyPortfolio(input, {
                network: PortfolioNetworkType.MAINNET,
                meta,
                vmType: VM_TYPE.BTC
            });

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

export function useSetActivePortfolio() {
    const { set } = useActiveAccountLocalStorage('activePortfolio');
    const client = useQueryClient();
    const accountQueryKey = useActiveAccountQueryKey();
    const portfolios = usePortfolios();

    return useMutation<Portfolio, Error, Pick<Portfolio, 'id'>>({
        async mutationFn({ id }) {
            const portfolioToSet = portfolios.find(a => a.id.isEq(id));

            if (!portfolioToSet) {
                throw new Error('Portfolio not found');
            }

            await set({
                portfolioId: portfolioToSet.id.toString()
            });

            await client.invalidateQueries({
                queryKey: accountQueryKey.activePortfolio.toKey()
            });

            return portfolioToSet;
        }
    });
}

export function useChangePortfolioMeta() {
    const update = useActiveAccountSyncStorageSlotUpdate('portfolios');

    return useMutation<void, Error, { portfolio: Portfolio; meta: Partial<PortfolioMeta> }>({
        mutationFn({ portfolio, meta }) {
            return update(draft =>
                draft.update(portfolio.jsonArrayId(), activePortfolioDraft => {
                    activePortfolioDraft.set('meta', {
                        ...activePortfolioDraft.get()!.meta,
                        ...meta
                    });
                })
            );
        }
    });
}

export function useRecordActivePortfolioSecretReveal() {
    const activePortfolio = useActivePortfolio();
    const update = useActiveAccountSyncStorageSlotUpdate('portfolios');
    const { deviceInfo } = useAppContext();

    return useMutation({
        mutationFn() {
            return update(draft =>
                draft.update(activePortfolio.jsonArrayId(), activePortfolioDraft => {
                    const bip39Draft = activePortfolioDraft.narrow(
                        (p): p is Extract<typeof p, { type: typeof PortfolioType.BIP39 }> =>
                            p.type === PortfolioType.BIP39
                    );

                    bip39Draft?.set('secretRevealedStatus', {
                        revealedAt: new Date().getTime(),
                        revealedFromDevice: deviceInfo.name
                    });
                })
            );
        }
    });
}

export function useActivePortfolio() {
    return useActivePortfolioEntities().portfolio;
}

export function useActiveBtcWallet(): BtcWalletReadOnly {
    return resolveBtcWallet(useActivePortfolio());
}

export function useActiveSignableBtcWallet(): SignableBtcWallet {
    const entities = useActivePortfolioEntities();

    if (entities.type !== 'bip39') {
        throw new Error('Signable wallet unavailable for watch-only portfolio');
    }

    return entities.btcWallet;
}

export function findPortfolioMetaByAddress(
    portfolios: Portfolio[],
    address: string
): PortfolioMeta | undefined {
    return portfolios.find(p => resolveBtcWallet(p).address === address)?.meta;
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
