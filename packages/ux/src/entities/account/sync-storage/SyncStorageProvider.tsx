import { useQueryClient } from '@tanstack/react-query';
import type { FC, PropsWithChildren } from 'react';
import { useEffect } from 'react';

import type { ISyncAccount } from '@safely/sync';
import type { SyncedStorageStructure } from '@safely/sync-storage';

import { SecretEncryptor, useAppContext } from '../../../shared';
import { useAppState } from '../../../shared/app/useAppState';
import { useAccounts } from '../account-state';
import { accountKey } from '../keys';
import { accountStore, accountStoreActions, SYNCED_SLOT_KEYS } from './account-store';
import { AccountStoreTransform } from './account-store-transform';

function useSyncObserver() {
    const { storage } = useAppContext();
    const accounts = useAccounts();
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!accounts || accounts.length === 0) {
            accountStoreActions.clear();
            return;
        }

        accountStoreActions.retainAccounts(new Set(accounts.map(a => a.accountId)));

        const unsubscribes: (() => void)[] = [];

        accounts.forEach((account: ISyncAccount<SyncedStorageStructure>) => {
            const transform = new AccountStoreTransform(
                () =>
                    new SecretEncryptor(account.secretEncryptor, storage.sync.getSecureEncrypted())
            );

            accountStoreActions.attachSnapshot(
                transform.restoreAll(account.accountId, account.syncProvider.getAll())
            );

            SYNCED_SLOT_KEYS.forEach(key => {
                const unsub = account.syncProvider.onChange(key, () => {
                    const slotJson = account.syncProvider.get(key);
                    const prev = accountStore.getState().accountsData.get(account.accountId);
                    const next = transform.restore(key, slotJson, prev ?? null);
                    accountStoreActions.setSlot(account.accountId, key, next);

                    if (key === 'portfolios') {
                        queryClient.invalidateQueries({
                            queryKey: accountKey
                                .accountId(account.accountId)
                                .activePortfolio.toKey()
                        });
                    }
                });
                unsubscribes.push(unsub);
            });
        });

        return () => {
            unsubscribes.forEach(fn => fn());
        };
    }, [accounts, storage.sync, queryClient]);
}

function useSyncRestartOnForeground() {
    const accounts = useAccounts();
    const { current, previous } = useAppState();

    useEffect(() => {
        if (previous === 'inactive' || (previous === 'background' && current === 'active')) {
            accounts.forEach(a => a.syncProvider.restart());
        }
    }, [accounts, current, previous]);
}

export const SyncStorageProvider: FC<PropsWithChildren> = ({ children }) => {
    useSyncObserver();
    useSyncRestartOnForeground();

    return <>{children}</>;
};
