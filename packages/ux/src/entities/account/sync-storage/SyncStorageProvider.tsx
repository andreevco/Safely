import type { FC, PropsWithChildren } from 'react';
import { useEffect } from 'react';

import type { ISyncAccount } from '@safely/sync';
import type { SyncedStorageStructure } from '@safely/sync-storage';

import { SecretEncryptor, useAppContext } from '../../../shared';
import { useAppState } from '../../../shared/app/useAppState';
import { useAccounts, useActiveAccountQuery } from '../account-state';
import { accountStore, accountStoreActions, SYNCED_SLOT_KEYS } from './account-store';
import { AccountStoreTransform } from './account-store-transform';

function useSyncObserver() {
    const { storage } = useAppContext();
    const accounts = useAccounts();

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
                });
                unsubscribes.push(unsub);
            });
        });

        return () => {
            unsubscribes.forEach(fn => fn());
        };
    }, [accounts, storage.sync]);
}

function useSyncRestartOnForeground() {
    const { data: activeAccount } = useActiveAccountQuery();
    const { current, previous } = useAppState();

    useEffect(() => {
        if (!activeAccount) return;

        if (previous === 'inactive' || (previous === 'background' && current === 'active')) {
            activeAccount.syncProvider.restart();
        }
    }, [activeAccount, current, previous]);
}

export const SyncStorageProvider: FC<PropsWithChildren> = ({ children }) => {
    useSyncObserver();
    useSyncRestartOnForeground();

    return <>{children}</>;
};
