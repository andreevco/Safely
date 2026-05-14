import { notifyManager, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';

import type { ITreeStorage, PortfolioBip39 } from '@safely/core';
import { delay, PortfolioFactory, PortfolioNetworkType } from '@safely/core';
import { generateBip39Accessor } from '@safely/core/entities/seed';
import type { ISyncAccount, OnboardingConnector as RawOnboardingConnector } from '@safely/sync';
import { OnboardingAbortedError } from '@safely/sync';

import type { OnboardingConnector, SyncAccount } from './account-state';
import {
    generateAccountMeta,
    resetAccountsFactory,
    useAccountsFactory,
    useActiveAccount,
    withMeta
} from './account-state';
import { accountKey } from './keys';
import { useActiveAccountSyncedStorage, useClearActiveAccountLocalStorage } from './storage';
import type { AccountMeta, SyncedStorageStructure } from '../../shared';
import { SecretEncryptor, useAppContext, useSharedUxStorage, useTranslate } from '../../shared';
import { useLoader } from '../loader';
import { useLogger } from '../logger';
import { useMutation } from '../query-core';
import { useUpdateOwnSyncedDeviceMeta } from '../synced-device';
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
            await account.syncProvider.set(
                'meta',
                generateAccountMeta(
                    account.accountId,
                    params?.name ?? t('security.groups.wallet.main')
                )
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

                await account.syncProvider.set('portfolios', [createdPortfolio.toJSON()]);
            }

            await client.invalidateQueries({ queryKey: accountKey.list.toKey() });

            if (options?.setActive) {
                const newAccountKey = accountKey.accountId(account.accountId);

                if (createdPortfolio) {
                    const derivation = createdPortfolio.getDerivations()[0];

                    notifyManager.batch(() => {
                        client.setQueryData(newAccountKey.portfolios.toKey(), [createdPortfolio]);
                        client.setQueryData(newAccountKey.portfolios.active.toKey(), {
                            kind: 'bip39' as const,
                            portfolio: createdPortfolio,
                            btcWallet: derivation.chains.btc.wallets[0],
                            derivation
                        });
                    });
                }

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
    const { storage } = useAppContext();
    const clearActiveAccountLocalStorage = useClearActiveAccountLocalStorage();

    return useMutation({
        async mutationFn() {
            using secureEncryptedStorage = storage.sync.getSecureEncrypted();
            await secureEncryptedStorage.unlock();

            const ikPubBuf = await account.getMyDeviceIkPub();
            const ikPub = ikPubBuf.toString('hex');
            const devicesMeta = account.syncProvider.get('devicesMeta');

            if (devicesMeta) {
                const { [ikPub]: _, ...rest } = devicesMeta;
                await account.syncProvider.set(
                    'devicesMeta',
                    Object.keys(rest).length > 0 ? rest : null
                );
            }

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
