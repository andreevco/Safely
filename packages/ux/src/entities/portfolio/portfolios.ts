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
    IPortfolioId,
    ISecretEncryptor
} from '@safely/core';
import {
    delay,
    Id,
    PortfolioAlreadyExistsError,
    PortfolioFactory,
    PortfolioNetworkType,
    PortfolioType,
    generateBip39Accessor,
    VM_TYPE
} from '@safely/core';

import { useTranslate, useSecurityCheck, useAppContext } from '../../shared';
import { useSuspenseQuery } from '../../shared';
import { useAccountStore, useActiveAccountLocalStorage } from '../account';
import {
    useActiveAccount,
    useActiveAccountQuery,
    useActiveAccountQueryKey
} from '../account/account-state';
import type { SActivePortfolioSchema } from '../account/local-storage/schemas/active-portfolio.schema';
import { useErrorToast } from '../errors';
import { useLogger } from '../logger';
import { useMutation } from '../query-core';
import { useToast } from '../toast';

const EMPTY_PORTFOLIOS: Portfolio[] = Object.freeze([]) as unknown as Portfolio[];

export function usePortfolios(): Portfolio[] {
    return useAccountStore(s => s.active?.portfolios ?? EMPTY_PORTFOLIOS);
}

function useSetPortfolios() {
    const account = useActiveAccount();
    const client = useQueryClient();
    const accountQueryKey = useActiveAccountQueryKey();

    return useMutation<void, Error, Portfolio[]>({
        async mutationFn(portfolios) {
            await account.syncProvider.set(
                'portfolios',
                portfolios.map(p => p.toJSON())
            );

            if (portfolios.length === 0) {
                client.setQueryData(accountQueryKey.portfolios.active.toKey(), null);
            }
        }
    });
}

export function useAddPortfolio() {
    const { mutateAsync } = useSetPortfolios();
    const portfolios = usePortfolios();

    return useMutation<void, Error, Portfolio>({
        async mutationFn(portfolio) {
            await mutateAsync(portfolios.concat(portfolio));
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
    const { mutateAsync: addPortfolio } = useAddPortfolio();
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
    const { mutateAsync } = useSetPortfolios();
    const check = useSecurityCheck();
    const portfolios = usePortfolios();

    return useMutation<void, Error, { id: IPortfolioId }>({
        async mutationFn({ id }) {
            await check();
            await mutateAsync(portfolios.filter(p => !p.id.isEq(id)));
        }
    });
}

export function useReorderPortfolios() {
    const { mutateAsync } = useSetPortfolios();

    return useMutation<void, Error, Portfolio[]>({
        async mutationFn(nextPortfoliosOrder) {
            await mutateAsync(nextPortfoliosOrder);
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
        queryKey: accountQueryKey.portfolios.active.toKey(),
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
    const logger = useLogger();

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
            [logger, portfolios]
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
    return useActivePortfolioEntitiesQuery() !== null;
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
                queryKey: accountQueryKey.portfolios.active.toKey()
            });

            return portfolioToSet;
        }
    });
}

export function useChangePortfolioMeta() {
    const { mutateAsync } = useSetPortfolios();
    const portfolios = usePortfolios();

    return useMutation<
        Portfolio,
        Error,
        { portfolio: { id: IPortfolioId }; meta: Partial<PortfolioMeta> }
    >({
        async mutationFn({ portfolio: { id }, meta }) {
            const portfolio = portfolios.find(p => p.id.isEq(id));
            if (!portfolio) {
                throw new Error('Portfolio not found');
            }

            const updated = portfolio.withMeta(meta);
            await mutateAsync(portfolios.map(p => (p.id.isEq(updated.id) ? updated : p)));
            return updated;
        }
    });
}

export function useRecordActivePortfolioSecretReveal() {
    const activePortfolio = useActivePortfolio();
    const { mutateAsync } = useSetPortfolios();
    const { deviceInfo } = useAppContext();
    const portfolios = usePortfolios();

    return useMutation({
        async mutationFn() {
            if (activePortfolio.type !== PortfolioType.BIP39) {
                return;
            }

            const portfolio = portfolios.find(p => p.id.isEq(activePortfolio.id));
            if (!portfolio || portfolio.type !== PortfolioType.BIP39) {
                return;
            }

            const updated = portfolio.withRecordedSecretReveal(deviceInfo.name);
            await mutateAsync(portfolios.map(p => (p.id.isEq(updated.id) ? updated : p)));
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
