import { useCallback, useMemo } from 'react';
import z from 'zod';

import { accountLocalStorageStructure, AccountLocalStorageStructure } from './schemas';
import { useActiveAccount } from '../../../../entities';
import { useAppContext } from '../../../providers';

function useActiveAccountLocalStorageInstance() {
    const {
        storage: { ux }
    } = useAppContext();

    const activeAccountId = useActiveAccount()?.accountId;

    return useMemo(
        () => (activeAccountId ? ux.regular.child(['account', activeAccountId]) : null),
        [ux.regular]
    );
}

export function useActiveAccountLocalStorage<K extends keyof AccountLocalStorageStructure>(key: K) {
    const storage = useActiveAccountLocalStorageInstance();

    const set = useCallback<(val: z.input<AccountLocalStorageStructure[K]>) => Promise<void>>(
        val => {
            accountLocalStorageStructure[key].parse(val);
            if (!storage) {
                throw new Error('Cannot set data to uninitialized storage');
            }
            return storage.setItem(key, JSON.stringify(val));
        },
        [storage]
    );

    const remove = useCallback<() => Promise<void>>(() => {
        if (!storage) {
            throw new Error('Cannot remove data from uninitialized storage');
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

export function useClearActiveAccountLocalStorage() {
    const storage = useActiveAccountLocalStorageInstance();

    return useCallback(() => {
        if (!storage) {
            throw new Error('Cannot clear data from uninitialized storage');
        }
        return storage.clear();
    }, [storage]);
}
