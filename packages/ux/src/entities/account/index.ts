import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';

import {
    delay,
    ITreeStorage,
    notNullish,
    PortfolioFactory,
    PortfolioNetworkType
} from '@safely/core';
import { generateBip39Accessor } from '@safely/core/entities/seed';
import { ISyncAccount, OnboardingAbortedError, SyncAccountFactory } from '@safely/sync';

import { accountKey } from './keys';
import {
    AccountMeta,
    SecretEncryptor,
    syncedStorageStructure,
    SyncedStorageStructure,
    useAppContext,
    useBootConfig,
    useSharedStructuredStorage,
    useSuspenseQuery,
    useTranslate
} from '../../shared';
import { useActiveAccountSyncedStorage } from '../../shared';
import { useLoader } from '../loader';
import {
    useCurrentDeviceIkPub,
    useSyncedDevicesMeta,
    useUpdateOwnSyncedDeviceMeta
} from '../synced-device';
import { useToast } from '../toast';

export type SyncAccount = ISyncAccount<SyncedStorageStructure> & {
    meta: AccountMeta;
};

export type OnboardingConnector = {
    connectionString: string;
    accountPromise: Promise<ISyncAccount<SyncedStorageStructure>>;
    abort: () => void;
};

function withMeta(account: ISyncAccount<SyncedStorageStructure>): SyncAccount {
    let meta = account.syncProvider.get('meta');
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

let _syncAccountFactory: SyncAccountFactory<SyncedStorageStructure> | null = null;

export function resetAccountsFactory() {
    _syncAccountFactory = null;
}

export function useAccountsFactory() {
    const config = useBootConfig();
    const { storage, encryptedStorage } = useAppContext();

    if (!_syncAccountFactory) {
        _syncAccountFactory = new SyncAccountFactory({
            storage,
            encryptedStorage,
            structure: syncedStorageStructure,
            apiConfiguration: {
                basePath: config.sync.api_url
            }
        });
    }

    return _syncAccountFactory;
}

function useAccountsQueryConfig() {
    const factory = useAccountsFactory();

    return {
        queryKey: accountKey.list.toKey(),
        async queryFn() {
            const accounts = await factory.getSyncAccounts();
            return accounts.map(withMeta);
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
            const accounts = await client.fetchQuery({ ...accountsQueryConfig, staleTime: 0 });
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

    return useMutation<
        ISyncAccount<SyncedStorageStructure>,
        Error,
        { name?: string; secureEncryptedStorage: ITreeStorage }
    >({
        async mutationFn(params) {
            await delay();

            const account = await factory.createSyncAccount(params.secureEncryptedStorage);
            await account.syncProvider.set(
                'meta',
                generateAccountMeta(
                    account.accountId,
                    params?.name ?? t('security.groups.wallet.main')
                )
            );

            if (options?.createWallet || options?.setActive) {
                const portfolioFactory = new PortfolioFactory(
                    new SecretEncryptor(account.secretEncryptor, params.secureEncryptedStorage)
                );
                using accessorVault = generateBip39Accessor();
                const portfolio = await portfolioFactory.generatePortfolioBip39(accessorVault, {
                    network: PortfolioNetworkType.MAINNET,
                    meta: { name: t('security.groups.wallet.defaultName', { number: 1 }) }
                });

                await account.syncProvider.set('portfolios', [portfolio.toJSON()]);
            }

            await client.invalidateQueries({ queryKey: accountKey.list.toKey() });

            if (options?.setActive) {
                await setActive(account.accountId);
            }

            return account;
        },
        onError(e) {
            console.error(e);
        }
    });
}

export function useCreateExistingAccountConnector() {
    const factory = useAccountsFactory();

    const mutation = useMutation<
        {
            connectionString: string;
            accountPromise: Promise<ISyncAccount<SyncedStorageStructure>>;
            abort: () => void;
        },
        Error,
        { secureEncryptedStorage: ITreeStorage }
    >({
        async mutationFn({ secureEncryptedStorage }) {
            await delay();
            const connector = await factory.connectToExistingSyncAccount(secureEncryptedStorage);

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
    const { mutateAsync: updateOwnSyncedDeviceMeta } = useUpdateOwnSyncedDeviceMeta();
    const setAsActive = options?.setAsActive ?? false;

    useEffect(() => {
        let isReset = false;
        connector.accountPromise
            .then(async account => {
                if (isReset) {
                    return;
                }

                await updateOwnSyncedDeviceMeta(account);

                if (isReset) {
                    return;
                }

                await client.invalidateQueries({ queryKey: accountKey.list.toKey() });
                if (setAsActive) {
                    await setActive(account.accountId);
                }

                callback(withMeta(account));
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
    const { withLoader } = useLoader();
    const { qrScanner } = useAppContext();

    return useMutation<void, Error, { secureEncryptedStorage: ITreeStorage }>({
        async mutationFn({ secureEncryptedStorage }) {
            const connectionString = await qrScanner.scan({
                titleTranslationKey: 'qrScan.addDevice.title',
                subTranslationKey: 'qrScan.addDevice.subtitle'
            });
            await withLoader(() =>
                activeKeeperId.connectToNewDevice(
                    Buffer.from(connectionString, 'base64url'),
                    secureEncryptedStorage
                )
            );
        },
        onSuccess() {
            toast(t('settings.deviceConnected'));
        },
        onError(e) {
            console.error(e);
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

            await client.refetchQueries({
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
            await client.refetchQueries({ queryKey: accountKey.list.toKey() });
        }
    });
}

export function useDeleteAccount() {
    const account = useActiveAccount();
    const accountFactory = useAccountsFactory();
    const client = useQueryClient();
    const { getSecureEncryptedStorage } = useAppContext();
    const ikPub = useCurrentDeviceIkPub();
    const devicesMeta = useSyncedDevicesMeta();

    return useMutation({
        async mutationFn() {
            using secureEncryptedStorage = getSecureEncryptedStorage();
            await secureEncryptedStorage.unlock();

            if (devicesMeta) {
                const { [ikPub]: _, ...rest } = devicesMeta;
                await account.syncProvider.set(
                    'devicesMeta',
                    Object.keys(rest).length > 0 ? rest : null
                );
            }

            await accountFactory.deleteLocalAccount(account.accountId, secureEncryptedStorage);

            const accounts = client.getQueryData<SyncAccount[]>(accountKey.list.toKey());
            const remaining = accounts?.filter(a => a.accountId !== account.accountId) ?? [];

            if (remaining.length > 0) {
                client.setQueryData(accountKey.list.toKey(), remaining);
                client.setQueryData(accountKey.list.active.toKey(), remaining[0]);
            } else {
                client.removeQueries({ queryKey: accountKey.toKey() });
            }
        }
    });
}

export function useEraseAllData() {
    const { clearAllData } = useAppContext();
    const queryClient = useQueryClient();

    return useMutation({
        async mutationFn() {
            resetAccountsFactory();
            await clearAllData();

            queryClient.clear();
        }
    });
}
