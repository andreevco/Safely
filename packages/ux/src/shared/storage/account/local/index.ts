import { useCallback, useMemo } from 'react';
import z from 'zod';

import { accountLocalStorageStructure, AccountLocalStorageStructure } from './schemas';
import { useActiveAccount } from '../../../../entities';
import { useAppContext } from '../../../providers';

export function useActiveAccountLocalStorage<K extends keyof AccountLocalStorageStructure>(key: K) {
    const {
        storage: { ux }
    } = useAppContext();
    const activeAccountId = useActiveAccount()?.accountId;

    const storage = useMemo(
        () => (activeAccountId ? ux.regular.child(['account', activeAccountId]) : null),
        [ux.regular]
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
