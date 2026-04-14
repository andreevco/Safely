import { useCallback, useMemo } from 'react';
import z from 'zod';

import { accountLocalStorageStructure, AccountLocalStorageStructure } from './schemas';
import { useActiveAccount } from '../../../../entities';
import { useStorageFactory } from '../../storage-factory';

export function useAccountLocalStorage<K extends keyof AccountLocalStorageStructure>(key: K) {
    const storageFactory = useStorageFactory();
    const activeAccountId = useActiveAccount()?.accountId;

    const storage = useMemo(
        () => (activeAccountId ? storageFactory.account(activeAccountId).local : null),
        [activeAccountId]
    );

    const set = useCallback<(val: z.input<AccountLocalStorageStructure[K]>) => Promise<void>>(
        val => {
            accountLocalStorageStructure[key].parse(val);
            if (!storage) {
                throw new Error('Cannot set data to uninitialized keeper id storage');
            }
            return storage.setItem(key, JSON.stringify(val));
        },
        [storage]
    );

    const remove = useCallback<() => Promise<void>>(() => {
        if (!storage) {
            throw new Error('Cannot remove data from uninitialized keeper id storage');
        }
        return storage.removeItem(key);
    }, [storage]);

    const get = useCallback<() => Promise<z.output<AccountLocalStorageStructure[K]>>>(async () => {
        const data = (await storage?.getItem(key)) ?? null;
        const structData: unknown = data === null ? null : JSON.parse(data);

        return accountLocalStorageStructure[key].parse(structData) as z.output<
            AccountLocalStorageStructure[K]
        >;
    }, [storage]);

    return { get, set, remove };
}
