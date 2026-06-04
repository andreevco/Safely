import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo } from 'react';

import type { ITreeStorage } from '@safely/core';
import { deriveAnalyticsAccountUuid } from '@safely/core';
import { PortfolioBip39, PortfolioIdBip39MasterKeyDerived } from '@safely/core';
import { PortfolioMnemonicFactory } from '@safely/core';
import { toPortfolioId } from '@safely/core';
import { delay, PortfolioNetworkType } from '@safely/core';
import type { ISyncAccount, OnboardingConnector as RawOnboardingConnector } from '@safely/sync';
import { OnboardingAbortedError } from '@safely/sync';
import type { SPortfolioBip39, SyncedStorageStructure } from '@safely/sync-storage';

import type { AccountMeta, OnboardingConnector, SyncAccount } from './account-state';
import { useAccountsQueryConfig } from './account-state';
import { useActiveAccountMeta } from './account-state';
import { useAccounts } from './account-state';
import { useAccountsFactory, useActiveAccount } from './account-state';
import { accountKey } from './keys';
import type { SActivePortfolioSchema } from './local-storage';
import { useClearActiveAccountLocalStorage } from './local-storage';
import { SecretEncryptor, useAppContext, useSharedUxStorage, useTranslate } from '../../shared';
import { useErrorToast } from '../errors';
import { useLoader } from '../loader';
import {
    useCurrentDeviceIkPub,
    useGenerateOwnSyncedDeviceMeta,
    useSetOwnSyncedDeviceMeta
} from '../synced-device';
import { useToast } from '../toast';
import {
    useAccountSyncStorageUpdate,
    useActiveAccountSyncStorageSlotUpdate
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
    const updateSyncStorage = useAccountSyncStorageUpdate();
    const generateOwnMeta = useGenerateOwnSyncedDeviceMeta();

    return useMutation<
        ISyncAccount<SyncedStorageStructure>,
        Error,
        { name?: string; secureEncryptedStorage: ITreeStorage },
        unknown
    >({
        async mutationFn(params) {
            await delay();

            const account = await factory.createSyncAccount(params.secureEncryptedStorage);

            let createdPortfolio: SPortfolioBip39 | null = null;
            const firstPortfolioDerivationIndex = 0;
            if (options?.createWallet || options?.setActive) {
                const portfolioMnemonicFactory = new PortfolioMnemonicFactory(
                    account,
                    params.secureEncryptedStorage
                );

                using mnemonicAccessor = await portfolioMnemonicFactory.deriveBip39MnemonicResource(
                    firstPortfolioDerivationIndex
                );

                const id = new PortfolioIdBip39MasterKeyDerived({
                    derivationIndex: firstPortfolioDerivationIndex,
                    networkType: PortfolioNetworkType.MAINNET
                });

                createdPortfolio = await PortfolioBip39.createSerializedPortfolio({
                    id,
                    mnemonicAccessor,
                    encryptor: new SecretEncryptor(
                        account.secretEncryptor,
                        params.secureEncryptedStorage
                    ),
                    options: {
                        meta: { name: t('security.groups.wallet.defaultName', { number: 1 }) }
                    }
                });
            }

            const analyticsId = await deriveAnalyticsAccountUuid(
                account,
                params.secureEncryptedStorage
            );

            await updateSyncStorage(account, draft => {
                draft.set('meta', { name: params?.name ?? newAccountName });

                const { key, value } = generateOwnMeta(account);
                draft.at('devicesMeta').orDefault({}).set(key, value);

                draft.at('analyticsId').set(analyticsId);

                if (createdPortfolio) {
                    draft.set('portfolios', [createdPortfolio]);
                    draft.set('latestDerivedBip39PortfolioIndex', firstPortfolioDerivationIndex);
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
    connector: OnboardingConnector | undefined,
    callback: (account: SyncAccount) => void,
    options?: { setAsActive: boolean; onError?: (e: Error) => void }
) {
    const { logger } = useAppContext();
    const client = useQueryClient();
    const { mutateAsync: setActive } = useSetActiveAccount();
    const { mutateAsync: updateOwnSyncedDeviceMeta } = useSetOwnSyncedDeviceMeta();
    const setAsActive = options?.setAsActive ?? false;

    useEffect(() => {
        let isReset = false;
        connector?.accountPromise
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

                logger.child('useAccountConnectedCallback').error(e);
                options?.onError?.(e instanceof Error ? e : new Error(String(e)));
            });
        return () => {
            connector?.abort();
            isReset = true;
        };
    }, [connector?.accountPromise, callback, client, setAsActive]);
}

export function useConnectAccountToNewDevice() {
    const t = useTranslate();
    const activeAccount = useActiveAccount();
    const toast = useToast();
    const errorToast = useErrorToast({
        ReconnectFromAnotherAccountError: 'settings.qrCodeFromAnotherAccount'
    });
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
        },
        onError: errorToast
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
    const update = useActiveAccountSyncStorageSlotUpdate('meta');

    return useMutation<void, Error, Partial<AccountMeta>>({
        async mutationFn(meta) {
            await update(draft => draft.set({ ...currentMeta, ...meta }));
        }
    });
}

export function useDeleteAccount() {
    const account = useActiveAccount();
    const accountFactory = useAccountsFactory();
    const client = useQueryClient();
    const ikPub = useCurrentDeviceIkPub();
    const clearActiveAccountLocalStorage = useClearActiveAccountLocalStorage();
    const update = useActiveAccountSyncStorageSlotUpdate('devicesMeta');

    return useMutation<void, Error, ITreeStorage>({
        async mutationFn(secureEncryptedStorage) {
            await update(draft => {
                draft.ifPresent(devicesMeta => devicesMeta.delete(ikPub));
            });

            await accountFactory.deleteLocalAccount(account.accountId, secureEncryptedStorage);
            await clearActiveAccountLocalStorage();

            const accounts = client.getQueryData<SyncAccount[]>(accountKey.list.toKey());
            const remaining = accounts?.filter(a => a.accountId !== account.accountId) ?? [];

            if (remaining.length > 0) {
                client.setQueryData(accountKey.list.toKey(), remaining);
                client.setQueryData(accountKey.list.active.toKey(), remaining[0]);
            }
        }
    });
}

export function useEraseAllData() {
    const {
        clearAllData,
        reloadApp,
        i18n: { t }
    } = useAppContext();
    const toast = useToast();

    return useMutation({
        async mutationFn() {
            try {
                await clearAllData();
                reloadApp();
            } catch (e) {
                toast({ type: 'error', message: t('logOutAllAccounts.error') });
                throw e;
            }
        }
    });
}
