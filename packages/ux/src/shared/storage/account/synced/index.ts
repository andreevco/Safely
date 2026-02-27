import { useCallback } from 'react';
import z from 'zod';

import { ISyncProvider } from '@safely/sync';

import { SyncedStorageStructure } from './schemas';
import { useAccounts, useActiveAccount } from '../../../../entities';

export type SyncProvider = ISyncProvider<SyncedStorageStructure>;

export function useGetSyncProvider(
    accountId: string | null
): () => Pick<SyncProvider, 'get' | 'set' | 'remove'> {
    const accounts = useAccounts();

    return useCallback(() => {
        if (accountId === null) {
            return {
                get() {
                    throw new Error('Cannot get data from uninitialized account storage');
                },
                set() {
                    throw new Error('Cannot set data to uninitialized account storage');
                },
                remove() {
                    throw new Error('Cannot remove data from uninitialized account storage');
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

export function useActiveAccountSyncedStorage<K extends keyof SyncedStorageStructure>(key: K) {
    const account = useActiveAccount();
    return useAccountSyncedStorage(account?.accountId ?? null, key);
}

export function useAccountSyncedStorage<K extends keyof SyncedStorageStructure>(
    accountId: string | null,
    key: K
) {
    const getSyncProvider = useGetSyncProvider(accountId);

    const get = useCallback(() => {
        return getSyncProvider().get(key);
    }, [getSyncProvider]);

    const set = useCallback<(val: z.input<SyncedStorageStructure[K]>) => Promise<void>>(
        val => {
            return getSyncProvider().set(key, val);
        },
        [getSyncProvider]
    );

    const remove = useCallback<() => Promise<void>>(() => {
        return getSyncProvider().remove(key);
    }, [getSyncProvider]);

    return { get, set, remove };
}
