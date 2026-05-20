import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo } from 'react';

import type { ITreeStorage, PortfolioBip39 } from '@safely/core';
import { toPortfolioId } from '@safely/core';
import { delay, PortfolioFactory, PortfolioNetworkType, generateBip39Accessor } from '@safely/core';
import type { ISyncAccount, OnboardingConnector as RawOnboardingConnector } from '@safely/sync';
import { OnboardingAbortedError } from '@safely/sync';
import type { SyncedStorageStructure } from '@safely/sync-storage';

import type { AccountMeta, OnboardingConnector, SyncAccount } from './account-state';
import { useAccountsQueryConfig } from './account-state';
import { useActiveAccountMeta } from './account-state';
import { useAccounts } from './account-state';
import { resetAccountsFactory, useAccountsFactory, useActiveAccount } from './account-state';
import { accountKey } from './keys';
import { SecretEncryptor, useAppContext, useSharedUxStorage, useTranslate } from '../../shared';
import { useLoader } from '../loader';
import { useLogger } from '../logger';
import { useMutation } from '../query-core';
import { useCurrentDeviceIkPub, useSetOwnSyncedDeviceMeta } from '../synced-device';
import { useToast } from '../toast';
import type { SActivePortfolioSchema } from './local-storage';
import { useClearActiveAccountLocalStorage } from './local-storage';
import {
    useAccountSyncStorageUpdate,
    useActiveAccountSyncStorageUpdate
} from './useAccountSyncStorageUpdate';

export * from './local-storage';
export * from './sync-storage';

export function useNewAccountDefaultName() {
    const accounts = useAccounts();
    const accountsLength = accounts.length ?? 0;
    const t = useTranslate();

    return useMemo(
        () => t('addAccount.defaultName', { number: accountsLength + 1 }),
        [t, accounts]
    );
}

export function useCreateAccount(options?: { createWallet?: boolean; setActive?: boolean }) {
    const t = useTranslate();
    const client = useQueryClient();
    const factory = useAccountsFactory();
    const { mutateAsync: setActive } = useSetActiveAccount();
    const newAccountName = useNewAccountDefaultName();
    const updatePortfolios = useAccountSyncStorageUpdate('portfolios');
    const updateMeta = useAccountSyncStorageUpdate('meta');

    return useMutation<
        ISyncAccount<SyncedStorageStructure>,
        Error,
        { name?: string; secureEncryptedStorage: ITreeStorage },
        unknown
    >({
        async mutationFn(params) {
            await delay();

            const account = await factory.createSyncAccount(params.secureEncryptedStorage);
            await updateMeta(account, (_, storeDraft) =>
                storeDraft.set('meta', { name: params?.name ?? newAccountName })
            );

            let createdPortfolio: PortfolioBip39 | null = null;

            if (options?.createWallet || options?.setActive) {
                const portfolioFactory = new PortfolioFactory(
                    new SecretEncryptor(account.secretEncryptor, params.secureEncryptedStorage)
                );
                using accessorVault = generateBip39Accessor();
                createdPortfolio = await portfolioFactory.generatePortfolioBip39(accessorVault, {
                    network: PortfolioNetworkType.MAINNET,
                    meta: { name: t('security.groups.wallet.defaultName', { number: 1 }) }
                });

                await updatePortfolios(account, (_, storeDraft) =>
                    storeDraft.set('portfolios', [createdPortfolio!.toJSON()])
                );
            }

            await client.invalidateQueries({ queryKey: accountKey.list.toKey() });

            if (options?.setActive) {
                await setActive(account.accountId);
            }

            return account;
        }
    });
}

function useConnectorMutation<TVars>(
    createConnector: (vars: TVars) => Promise<RawOnboardingConnector<SyncedStorageStructure>>
) {
    const mutation = useMutation<OnboardingConnector, Error, TVars>({
        async mutationFn(vars) {
            await delay();
            const connector = await createConnector(vars);

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

export function useCreateExistingAccountConnector() {
    const factory = useAccountsFactory();

    return useConnectorMutation(
        ({ secureEncryptedStorage }: { secureEncryptedStorage: ITreeStorage }) =>
            factory.connectToExistingSyncAccount(secureEncryptedStorage)
    );
}

export function useCreateReconnectConnector() {
    const account = useActiveAccount();

    return useConnectorMutation<void>(() => account.reconnectToAccount());
}

export function useAccountConnectedCallback(
    connector: OnboardingConnector,
    callback: (account: SyncAccount) => void,
    options?: { setAsActive: boolean; onError?: (e: Error) => void }
) {
    const logger = useLogger();
    const client = useQueryClient();
    const { mutateAsync: setActive } = useSetActiveAccount();
    const { mutateAsync: updateOwnSyncedDeviceMeta } = useSetOwnSyncedDeviceMeta();
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

                callback(account as SyncAccount);
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
    const activeAccount = useActiveAccount();
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
                activeAccount.connectToNewDevice(
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
    const accountsQuery = useAccountsQueryConfig();

    return useMutation<void, Error, string>({
        async mutationFn(id) {
            await delay();
            await set(id);

            const activePortfolioKey = accountKey.accountId(id).activePortfolio.toKey();
            if (client.getQueryData(activePortfolioKey) === undefined) {
                const accounts = await client.fetchQuery(accountsQuery);
                const account = accounts.find(a => a.accountId === id);
                if (!account) {
                    throw new Error('Account not found');
                }

                const portfolio = account.syncProvider.get('portfolios')[0];
                client.setQueryData<SActivePortfolioSchema>(
                    activePortfolioKey,
                    portfolio
                        ? {
                              portfolioId: toPortfolioId(portfolio).toString()
                          }
                        : null
                );
            }

            await client.refetchQueries({
                queryKey: accountKey.list.active.toKey()
            });
        }
    });
}

export function useChangeAccountMeta() {
    const currentMeta = useActiveAccountMeta();
    const update = useActiveAccountSyncStorageUpdate('meta');

    return useMutation<void, Error, Partial<AccountMeta>>({
        async mutationFn(meta) {
            await update((_, storeDraft) => {
                storeDraft.set('meta', { ...currentMeta, ...meta });
            });
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
    const update = useActiveAccountSyncStorageUpdate('devicesMeta');

    return useMutation({
        async mutationFn() {
            using secureEncryptedStorage = storage.sync.getSecureEncrypted();
            await secureEncryptedStorage.unlock();

            await update(draft => draft.delete(ikPub));

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
    const {
        clearAllData,
        i18n: { t }
    } = useAppContext();
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation({
        async mutationFn() {
            resetAccountsFactory();
            try {
                await clearAllData();
            } catch (e) {
                toast({ type: 'error', message: t('logOutAllAccounts.error') });
                throw e;
            }

            queryClient.clear();
        }
    });
}
