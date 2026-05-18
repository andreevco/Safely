import { useCallback, useMemo } from 'react';
import type z from 'zod';

import type { SharedStorageStructure } from './schemas';
import { sharedStorageStructure } from './schemas';
import { useAppContext } from '../providers';

export function useSharedUxStorage<K extends keyof SharedStorageStructure>(key: K) {
    const { storage } = useAppContext();
    const sharedStorage = useMemo(() => storage.ux.regular.child('shared'), [storage.ux.regular]);

    const set = useCallback<(val: z.input<SharedStorageStructure[K]>) => Promise<void>>(
        val => {
            sharedStorageStructure[key].parse(val);
            return sharedStorage.setItem(key, JSON.stringify(val));
        },
        [sharedStorage]
    );

    const remove = useCallback<() => Promise<void>>(() => {
        return sharedStorage.removeItem(key);
    }, [sharedStorage]);

    const get = useCallback<() => Promise<z.output<SharedStorageStructure[K]>>>(async () => {
        const data = await sharedStorage.getItem(key);
        const structData: unknown = data === null ? null : JSON.parse(data);

        return sharedStorageStructure[key].parse(structData) as z.output<SharedStorageStructure[K]>;
    }, [sharedStorage]);

    return { get, set, remove };
}
