import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import type {
    BtcWalletReadOnly,
    SignableBtcWallet,
    IDerivation,
    IMnemonicAccessor,
    Portfolio,
    PortfolioMeta,
    PortfolioWatchOnly,
    ISecretEncryptor,
    ITreeStorage,
    IMnemonicVault
} from '@safely/core';
import { PortfolioWatchOnlyBtc } from '@safely/core';
import { PortfolioIdBip39Imported } from '@safely/core';
import { PortfolioBip39, PortfolioIdBip39MasterKeyDerived } from '@safely/core';
import { PortfolioMnemonicFactory } from '@safely/core';
import { toPortfolioId } from '@safely/core';
import {
    delay,
    Id,
    PortfolioAlreadyExistsError,
    PortfolioNetworkType,
    PortfolioType
} from '@safely/core';
import type { SPortfolio } from '@safely/sync-storage';

import { useTranslate, useSecurityCheck, useAppContext, SecretEncryptor } from '../../shared';
import { useSuspenseQuery } from '../../shared';
import type { SActivePortfolioSchema, UseAccountSyncStorageUpdateOptions } from '../account';
import { useAccountSyncStorageUpdate } from '../account';
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

const EMPTY_PORTFOLIOS: Portfolio[] = Object.freeze([]) as unknown as Portfolio[];

export function usePortfolios(): Portfolio[] {
    return useActiveAccountStoreSlot('portfolios') ?? EMPTY_PORTFOLIOS;
}

export function useAddPortfolio(options?: UseAccountSyncStorageUpdateOptions) {
    const update = useActiveAccountSyncStorageSlotUpdate('portfolios', options);

    return useMutation<void, Error, SPortfolio>({
        async mutationFn(portfolio) {
            return update(draft => draft.push(portfolio));
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
    const { data: account } = useActiveAccountQuery();
    const update = useAccountSyncStorageUpdate();

    const errorToast = useErrorToast({
        PortfolioGenerationFailedError: 'importWalletScreen.errors.failedToGenerate'
    });

    return useMutation<
        void,
        Error,
        { meta: PortfolioMeta; secureEncryptedStorage: ITreeStorage },
        unknown
    >({
        async mutationFn(params) {
            await delay();

            if (!account) {
                throw new Error('Cannot generate portfolio without active account');
            }

            const portfolioMnemonicFactory = new PortfolioMnemonicFactory(
                account,
                params.secureEncryptedStorage
            );

            const latestWalletIndex = account.syncProvider.get('latestDerivedBip39PortfolioIndex');
            const nextWalletIndex = latestWalletIndex === null ? 0 : latestWalletIndex + 1;
            using mnemonicAccessor =
                await portfolioMnemonicFactory.deriveBip39MnemonicResource(nextWalletIndex);

            const id = new PortfolioIdBip39MasterKeyDerived({
                derivationIndex: nextWalletIndex,
                networkType: PortfolioNetworkType.MAINNET
            });

            const portfolio = await PortfolioBip39.createSerializedPortfolio({
                mnemonicAccessor,
                encryptor: new SecretEncryptor(
                    account.secretEncryptor,
                    params.secureEncryptedStorage
                ),
                id,
                options: { meta: params.meta }
            });

            await update(account, draft => {
                draft.at('portfolios').push(portfolio);
                const latestDerivedBip39PortfolioIndex = draft
                    .at('latestDerivedBip39PortfolioIndex')
                    .get();

                if (
                    latestDerivedBip39PortfolioIndex === null ||
                    nextWalletIndex > latestDerivedBip39PortfolioIndex
                ) {
                    draft.at('latestDerivedBip39PortfolioIndex').set(nextWalletIndex);
                }
            });

            await setActivePortfolio({ id });
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
        void,
        Error,
        {
            mnemonicAccessor: IMnemonicAccessor & IMnemonicVault;
            secretEncryptor: ISecretEncryptor;
            meta: PortfolioMeta;
        },
        unknown
    >({
        async mutationFn({ mnemonicAccessor, secretEncryptor, meta }) {
            await delay();

            const id = await PortfolioIdBip39Imported.create(
                mnemonicAccessor,
                PortfolioNetworkType.MAINNET
            );

            const portfolio = await PortfolioBip39.createSerializedPortfolio({
                id,
                encryptor: secretEncryptor,
                mnemonicAccessor,
                options: {
                    meta,
                    seedRevealedFromDevice: deviceInfo.name
                }
            });

            const existingBip39 = portfolios.find(p => p.id.isEq(id));

            if (existingBip39) {
                throw new PortfolioAlreadyExistsError(existingBip39);
            }

            await addPortfolio(portfolio);

            await setActivePortfolio({ id });
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
    const client = useQueryClient();
    const accountQueryKey = useActiveAccountQueryKey();

    return useMutation<void, Error, Portfolio>({
        async mutationFn(portfolio) {
            await check();
            await update(draft => draft.remove(portfolio.jsonArrayId()));
            await client.invalidateQueries({
                queryKey: accountQueryKey.activePortfolio.toKey()
            });
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
    const { get, set } = useActiveAccountLocalStorage('activePortfolio');
    const accountQueryKey = useActiveAccountQueryKey();
    const { data: activeAccount } = useActiveAccountQuery();

    return useSuspenseQuery<SActivePortfolioSchema, unknown, TData>({
        queryKey: accountQueryKey.activePortfolio.toKey(),
        async queryFn() {
            if (!activeAccount) return null;

            const stored = await get();

            const portfolios = activeAccount.syncProvider.get('portfolios');

            if (portfolios.length === 0) return stored;

            const storedIsValid =
                stored !== null &&
                portfolios.some(p => toPortfolioId(p).isEq(Id.fromString(stored.portfolioId)));

            if (storedIsValid) return stored;

            const next: SActivePortfolioSchema = {
                portfolioId: toPortfolioId(portfolios[0]).toString()
            };
            await set(next);
            return next;
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
                if (portfolios.length === 0 || !sActivePortfolioSchema) return null;

                const portfolio =
                    portfolios.find(p =>
                        p.id.isEq(Id.fromString(sActivePortfolioSchema.portfolioId))
                    ) ?? portfolios[0];

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
            const id = PortfolioWatchOnlyBtc.resolveUserInput(input, PortfolioNetworkType.MAINNET);

            const portfolio = PortfolioWatchOnlyBtc.create(id, meta);

            const existing = portfolios.find(p => p.id.isEq(portfolio.id));
            if (existing) {
                throw new PortfolioAlreadyExistsError(existing);
            }

            await addPortfolio(portfolio.toJSON());
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
                        ...activePortfolioDraft.get().meta,
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
