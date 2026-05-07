import { useCallback } from 'react';

import { ISyncProvider } from '@safely/sync';

import {
    SyncedStorageSchema,
    SyncedStorageShape
} from '../../../shared/storage/account/synced/schemas';
import { useAccounts, useActiveAccount } from '../account-state';

export type SyncProvider = ISyncProvider<SyncedStorageSchema>;

export function useGetSyncProvider(
    accountId: string | null
): () => Pick<SyncProvider, 'get' | 'update'> {
    const accounts = useAccounts();

    return useCallback(() => {
        if (accountId === null) {
            return {
                get() {
                    throw new Error('Cannot get data from uninitialized account storage');
                },
                update() {
                    throw new Error('Cannot update data in uninitialized account storage');
                }
            };
        }

        const account = accounts.find(a => a.accountId === accountId);
        if (!account) {
            throw new Error(`Unable to find account by given id ${accountId}`);
        }

        return account.syncProvider;
    }, [accounts, accountId]);
}

export function useActiveAccountSyncedStorage<K extends keyof SyncedStorageShape>(key: K) {
    const account = useActiveAccount();
    return useAccountSyncedStorage(account.accountId, key);
}

export function useAccountSyncedStorage<K extends keyof SyncedStorageShape>(
    accountId: string | null,
    key: K
) {
    const getSyncProvider = useGetSyncProvider(accountId);

    const get = useCallback(() => {
        return getSyncProvider().get(key);
    }, [getSyncProvider, key]);

    const update = useCallback<SyncProvider['update']>(
        val => {
            return getSyncProvider().update(val);
        },
        [getSyncProvider]
    );

    return { get, update };
}
