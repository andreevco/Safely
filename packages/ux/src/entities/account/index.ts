import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo } from 'react';

import { delay, notNullish, PortfolioFactory, PortfolioNetworkType } from '@safely/core';
import { generateBip39Accessor } from '@safely/core/entities/seed';
import { ISyncAccount, OnboardingAbortedError, SyncAccountFactory } from '@safely/sync';

import { accountKey } from './keys';
import {
    AccountMeta,
    syncedStorageStructure,
    SyncedStorageStructure,
    useAppContext,
    useBootConfig,
    useSharedStructuredStorage,
    useSuspenseQuery,
    useTranslate
} from '../../shared';
import { useActiveAccountSyncedStorage } from '../../shared';
import { useToast } from '../toast';

export type SyncAccount = ISyncAccount<SyncedStorageStructure> & {
    meta: AccountMeta;
};

export type OnboardingConnector = {
    connectionString: string;
    accountPromise: Promise<ISyncAccount<SyncedStorageStructure>>;
    abort: () => void;
};

let _activeConnector: OnboardingConnector | null = null;

export function setActiveConnector(connector: OnboardingConnector | null) {
    _activeConnector = connector;
}

export function getActiveConnector(): OnboardingConnector {
    if (!_activeConnector) {
        throw new Error('No active connector');
    }

    return _activeConnector;
}

async function withMeta(account: ISyncAccount<SyncedStorageStructure>): Promise<SyncAccount> {
    let meta = await account.syncProvider.get('meta');
    if (!meta) {
        meta = generateAccountMeta(account.accountId);
    }

    (account as SyncAccount).meta = meta;
    return account as SyncAccount;
}

function generateAccountMeta(accountId: string, name?: string) {
    return {
        name: name ?? `Account ${accountId.slice(-6)}`,
        icon: {
            type: 'color' as const,
            value:
                '#' +
                Math.floor(Number(`0x${accountId.slice(-6)}`))
                    .toString(16)
                    .padStart(6, '0')
        }
    };
}

export function useAccountsFactory() {
    const config = useBootConfig();
    const { storage, encryptedStorage, secureEncryptedStorage } = useAppContext();

    return useMemo(() => {
        return new SyncAccountFactory({
            storage,
            encryptedStorage,
            secureEncryptedStorage,
            structure: syncedStorageStructure,
            apiConfiguration: {
                basePath: config.sync.api_url
            }
        });
    }, [config, storage, encryptedStorage, secureEncryptedStorage]);
}

function useAccountsQueryConfig() {
    const factory = useAccountsFactory();

    return {
        queryKey: accountKey.list.toKey(),
        async queryFn() {
            const accounts = await factory.getSyncAccounts();
            return Promise.all(accounts.map(withMeta));
        },
        staleTime: Infinity
    };
}

export function useAccounts() {
    const query = useAccountsQueryConfig();

    return useSuspenseQuery(query).data;
}

export function useActiveAccountQuery() {
    const { set, get } = useSharedStructuredStorage('activeAccount');
    const client = useQueryClient();
    const accountsQueryConfig = useAccountsQueryConfig();

    return useSuspenseQuery({
        queryKey: accountKey.list.active.toKey(),
        async queryFn() {
            const activeId = await get();
            const accounts = await client.ensureQueryData(accountsQueryConfig);
            let activeAccount = accounts.find(k => k.accountId === activeId);

            if (!activeAccount) {
                if (accounts.length === 0) {
                    return null;
                } else {
                    activeAccount = accounts[0];
                    await set(activeAccount.accountId);
                }
            }

            return activeAccount;
        },
        staleTime: Infinity
    });
}

export function useCreateAccount(options?: { createWallet?: boolean; setActive?: boolean }) {
    const t = useTranslate();
    const client = useQueryClient();
    const factory = useAccountsFactory();
    const { mutateAsync: setActive } = useSetActiveAccount();

    return useMutation({
        async mutationFn() {
            await delay();
            const account = await factory.createSyncAccount();
            await account.syncProvider.set(
                'meta',
                generateAccountMeta(account.accountId, t('settings.wallet.main'))
            );

            if (options?.createWallet || options?.setActive) {
                const portfolioFactory = new PortfolioFactory(account.secretEncryptor);
                using accessorVault = generateBip39Accessor();
                const portfolio = await portfolioFactory.generatePortfolioBip39(accessorVault, {
                    network: PortfolioNetworkType.MAINNET,
                    name: t('settings.wallet.defaultName', { number: 1 })
                });

                await account.syncProvider.set('portfolios', [portfolio.toJSON()]);
            }

            await client.invalidateQueries({ queryKey: accountKey.list.toKey() });

            if (options?.setActive) {
                await setActive(account.accountId);
            }

            return account;
        }
    });
}

export function useCreateExistingAccountConnector() {
    const factory = useAccountsFactory();

    const mutation = useMutation({
        async mutationFn() {
            await delay();
            const connector = await factory.connectToExistingSyncAccount();

            return {
                connectionString: connector.data.toString('base64url'),
                accountPromise: connector.waitForCompletion(),
                abort() {
                    connector.abort();
                }
            };
        }
    });

    const originalReset = mutation.reset;

    const reset = useCallback(() => {
        mutation.data?.abort();
        originalReset();
    }, [mutation.data, originalReset]);

    return {
        ...mutation,
        reset
    };
}

export function useAccountConnectedCallback(
    connector: OnboardingConnector,
    callback: (account: SyncAccount) => void,
    options?: { setAsActive: boolean; onError?: (e: Error) => void }
) {
    const client = useQueryClient();
    const { mutateAsync: setActive } = useSetActiveAccount();
    const setAsActive = options?.setAsActive ?? false;

    useEffect(() => {
        let isReset = false;
        connector.accountPromise
            .then(async account => {
                if (isReset) {
                    return;
                }

                await account.syncProvider.waitForInitialSync();

                if (isReset) {
                    return;
                }

                await client.invalidateQueries({ queryKey: accountKey.list.toKey() });
                if (setAsActive) {
                    await setActive(account.accountId);
                }

                callback(await withMeta(account));
            })
            .catch(e => {
                if (isReset || e instanceof OnboardingAbortedError) {
                    return;
                }

                console.error('[useAccountConnectedCallback]', e);
                options?.onError?.(e instanceof Error ? e : new Error(String(e)));
            });
        return () => {
            isReset = true;
        };
    }, [connector.accountPromise, callback, client, setAsActive]);
}

export function useHasAccount() {
    const { data: activeAccount } = useActiveAccountQuery();
    return notNullish(activeAccount);
}

export function useActiveAccount() {
    const { data: activeAccount } = useActiveAccountQuery();
    if (activeAccount === null) {
        throw new Error('Account id not found');
    }

    return activeAccount;
}

export function useActiveAccountQueryKey() {
    const { data: activeAccount } = useActiveAccountQuery();
    return accountKey.accountId(activeAccount?.accountId);
}

export function useConnectAccountToNewDevice() {
    const t = useTranslate();
    const activeKeeperId = useActiveAccount();
    const toast = useToast();
    const { qrScanner } = useAppContext();

    return useMutation({
        async mutationFn() {
            const connectionString = await qrScanner.scan();
            await activeKeeperId.connectToNewDevice(Buffer.from(connectionString, 'base64url'));
        },
        onSuccess() {
            toast(t('settings.deviceConnected'));
        }
    });
}

export function useSetActiveAccount() {
    const { set } = useSharedStructuredStorage('activeAccount');
    const client = useQueryClient();

    return useMutation<void, Error, string>({
        async mutationFn(id) {
            await delay();
            await set(id);

            await client.invalidateQueries({
                queryKey: accountKey.list.active.toKey()
            });
        }
    });
}

export function useChangeAccountMeta() {
    const account = useActiveAccount();
    const client = useQueryClient();
    const { set } = useActiveAccountSyncedStorage('meta');

    return useMutation<void, Error, Partial<AccountMeta>>({
        async mutationFn(meta) {
            await set({ ...account.meta, ...meta });
            await client.invalidateQueries({ queryKey: accountKey.list.toKey() });
        }
    });
}

export function useDeleteAccount() {
    const account = useActiveAccount();
    const accountFactory = useAccountsFactory();
    const client = useQueryClient();
    const { remove: removeActiveAccount } = useSharedStructuredStorage('activeAccount');

    return useMutation({
        async mutationFn() {
            await accountFactory.deleteLocalAccount(account.accountId);
            await removeActiveAccount();
            client.removeQueries({ queryKey: accountKey.toKey() });
        }
    });
}

export function useEraseAllData() {
    const { clearAllData } = useAppContext();
    const queryClient = useQueryClient();

    return useMutation({
        async mutationFn() {
            await clearAllData();

            queryClient.clear();
        }
    });
}
