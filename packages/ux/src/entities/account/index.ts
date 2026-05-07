import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';

import { delay, ITreeStorage, PortfolioFactory, PortfolioNetworkType } from '@safely/core';
import { generateBip39Accessor } from '@safely/core/entities/seed';
import { ISyncAccount, OnboardingAbortedError } from '@safely/sync';

import {
    generateAccountMeta,
    OnboardingConnector,
    resetAccountsFactory,
    SyncAccount,
    useAccountsFactory,
    useActiveAccount,
    withMeta
} from './account-state';
import { accountKey } from './keys';
import { useActiveAccountSyncedStorage, useClearActiveAccountLocalStorage } from './storage';
import {
    AccountMeta,
    SecretEncryptor,
    SyncedStorageStructure,
    useAppContext,
    useSharedUxStorage,
    useTranslate
} from '../../shared';
import { portfoliosToOrderedSet } from '../../shared/storage/account/synced/schemas/portfolios.schema';
import { useLoader } from '../loader';
import { useLogger } from '../logger';
import { useMutation } from '../query-core';
import { useCurrentDeviceIkPub, useUpdateOwnSyncedDeviceMeta } from '../synced-device';
import { useToast } from '../toast';

export {
    type SyncAccount,
    type OnboardingConnector,
    resetAccountsFactory,
    useAccountsFactory,
    useAccounts,
    useActiveAccountQuery,
    useHasAccount,
    useActiveAccount,
    useActiveAccountQueryKey
} from './account-state';
export * from './storage';
export * from './sync';

export function useCreateAccount(options?: { createWallet?: boolean; setActive?: boolean }) {
    const t = useTranslate();
    const client = useQueryClient();
    const factory = useAccountsFactory();
    const { mutateAsync: setActive } = useSetActiveAccount();

    return useMutation<
        ISyncAccount<SyncedStorageStructure>,
        Error,
        { name?: string; secureEncryptedStorage: ITreeStorage },
        unknown
    >({
        async mutationFn(params) {
            await delay();

            const account = await factory.createSyncAccount(params.secureEncryptedStorage);
            const meta = generateAccountMeta(
                account.accountId,
                params?.name ?? t('security.groups.wallet.main')
            );
            let portfolios: ReturnType<typeof portfoliosToOrderedSet> | null = null;

            if (options?.createWallet || options?.setActive) {
                const portfolioFactory = new PortfolioFactory(
                    new SecretEncryptor(account.secretEncryptor, params.secureEncryptedStorage)
                );
                using accessorVault = generateBip39Accessor();
                const portfolio = await portfolioFactory.generatePortfolioBip39(accessorVault, {
                    network: PortfolioNetworkType.MAINNET,
                    meta: { name: t('security.groups.wallet.defaultName', { number: 1 }) }
                });

                portfolios = portfoliosToOrderedSet([portfolio.toJSON()]);
            }

            await account.syncProvider.update(draft => {
                draft.meta = meta;
                if (portfolios) {
                    (draft as { portfolios: unknown }).portfolios = portfolios;
                }
            });

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
    const logger = useLogger();
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

                logger.error('[useAccountConnectedCallback]', e);
                options?.onError?.(e instanceof Error ? e : new Error(String(e)));
            });
        return () => {
            isReset = true;
        };
    }, [connector.accountPromise, callback, client, setAsActive]);
}

export function useConnectAccountToNewDevice() {
    const t = useTranslate();
    const activeKeeperId = useActiveAccount();
    const toast = useToast();
    const { withLoader } = useLoader();
    const { qrScanner } = useAppContext();

    return useMutation<void, Error, { secureEncryptedStorage: ITreeStorage }, unknown>({
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
        }
    });
}

export function useSetActiveAccount() {
    const { set } = useSharedUxStorage('activeAccount');
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
    const { update } = useActiveAccountSyncedStorage('meta');

    return useMutation<void, Error, Partial<AccountMeta>>({
        async mutationFn(meta) {
            await update(draft => {
                if (draft.meta) {
                    draft.meta = { ...draft.meta, ...meta };
                } else {
                    draft.meta = { ...account.meta, ...meta };
                }
            });
            await client.refetchQueries({ queryKey: accountKey.list.toKey() });
        }
    });
}

export function useDeleteAccount() {
    const account = useActiveAccount();
    const accountFactory = useAccountsFactory();
    const client = useQueryClient();
    const { storage } = useAppContext();
    const ikPub = useCurrentDeviceIkPub();
    const clearActiveAccountLocalStorage = useClearActiveAccountLocalStorage();

    return useMutation({
        async mutationFn() {
            using secureEncryptedStorage = storage.sync.getSecureEncrypted();
            await secureEncryptedStorage.unlock();

            await account.syncProvider.update(draft => {
                if (!draft.devicesMeta) {
                    return;
                }

                delete draft.devicesMeta[ikPub];
                if (Object.keys(draft.devicesMeta).length === 0) {
                    draft.devicesMeta = null;
                }
            });

            await accountFactory.deleteLocalAccount(account.accountId, secureEncryptedStorage);
            await clearActiveAccountLocalStorage();

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
