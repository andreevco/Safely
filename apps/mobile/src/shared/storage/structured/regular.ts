import { useCallback } from 'react';
import z from 'zod';

import { REGULAR_MOBILE_STORAGE_ONLY_APP_LEVEL_USE } from '@mobile/app/storage';

const mobileLayerRegularStorageStructure = {
    passcodeLockout: z.union([
        z.null(),
        z.object({
            failedAttempts: z.number(),
            lockedUntil: z.number().nullable()
        })
    ]),
    biometryEnabled: z.union([z.null(), z.boolean()]),
    lockScreenEnabled: z.union([z.null(), z.boolean()])
};

type MobileLayerRegularStorageStructure = typeof mobileLayerRegularStorageStructure;

const storage = REGULAR_MOBILE_STORAGE_ONLY_APP_LEVEL_USE.storage.child('mobile');

export function useMobileLayerRegularStorage<K extends keyof MobileLayerRegularStorageStructure>(
    key: K
) {
    const set = useCallback<(val: z.input<MobileLayerRegularStorageStructure[K]>) => Promise<void>>(
        val => {
            mobileLayerRegularStorageStructure[key].parse(val);
            return storage.setItem(key, JSON.stringify(val));
        },
        []
    );

    const remove = useCallback<() => Promise<void>>(() => {
        return storage.removeItem(key);
    }, []);

    const get = useCallback<
        () => Promise<z.output<MobileLayerRegularStorageStructure[K]>>
    >(async () => {
        const data = await storage.getItem(key);
        const structData: unknown = data === null ? null : JSON.parse(data);

        return mobileLayerRegularStorageStructure[key].parse(structData) as z.output<
            MobileLayerRegularStorageStructure[K]
        >;
    }, []);

    return { get, set, remove };
}
