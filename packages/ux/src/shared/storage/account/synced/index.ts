import { useCallback } from 'react';
import z from 'zod';

import { syncedStorageStructure, SyncedStorageStructure } from './schemas';
import { useAccounts, useActiveAccount } from '../../../../entities';

export function useGetSyncProvider(accountId: string | null) {
    const accounts = useAccounts();

    return useCallback(() => {
        if (accountId === null) {
            return {
                getItem() {
                    return null;
                },
                setItem() {
                    throw new Error('Cannot set data to uninitialized keeper id storage');
                },
                removeItem() {
                    throw new Error('Cannot remove data from uninitialized keeper id storage');
                }
            };
        }

        const keeperIdInstance = accounts.find(a => a.id === accountId);
        if (!keeperIdInstance) {
            throw new Error(`Unable to get keeper id for ${accountId}`);
        }

        return keeperIdInstance.syncProvider;
    }, [accounts, accountId]);
}

export function useActiveAccountSyncedStorage<K extends keyof SyncedStorageStructure>(key: K) {
    const account = useActiveAccount();
    return useAccountSyncedStorage(account?.id ?? null, key);
}

export function useAccountSyncedStorage<K extends keyof SyncedStorageStructure>(
    accountId: string | null,
    key: K
) {
    const getSyncProvider = useGetSyncProvider(accountId);

    const get = useCallback(async () => {
        const val = await getSyncProvider().getItem(key);
        if (val === null) {
            return null;
        }

        return syncedStorageStructure[key].parse(JSON.parse(val)) as z.output<
            SyncedStorageStructure[K]
        >;
    }, [getSyncProvider]);

    const set = useCallback<(val: z.input<SyncedStorageStructure[K]>) => Promise<void>>(
        val => {
            syncedStorageStructure[key].parse(val);
            return getSyncProvider().setItem(key, JSON.stringify(val));
        },
        [getSyncProvider]
    );

    const remove = useCallback<() => Promise<void>>(() => {
        return getSyncProvider().removeItem(key);
    }, [getSyncProvider]);

    return { get, set, remove };
}
