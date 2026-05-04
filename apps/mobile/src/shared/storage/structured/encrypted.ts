import { useCallback } from 'react';
import z from 'zod';

import { storagesList } from '@mobile/app/storage';

const mobileLayerEncryptedStorageStructure = {
    passcode: z.union([z.null(), z.string()])
};

type MobileLayerEncryptedStorageStructure = typeof mobileLayerEncryptedStorageStructure;

const storage = storagesList.encrypted.storage.child('mobile');

export function useMobileLayerEncryptedStorage<
    K extends keyof MobileLayerEncryptedStorageStructure
>(key: K) {
    const set = useCallback<
        (val: z.input<MobileLayerEncryptedStorageStructure[K]>) => Promise<void>
    >(val => {
        mobileLayerEncryptedStorageStructure[key].parse(val);
        return storage.setItem(key, JSON.stringify(val));
    }, []);

    const remove = useCallback<() => Promise<void>>(() => {
        return storage.removeItem(key);
    }, []);

    const get = useCallback<
        () => Promise<z.output<MobileLayerEncryptedStorageStructure[K]>>
    >(async () => {
        const data = await storage.getItem(key);
        const structData: unknown = data === null ? null : JSON.parse(data);

        return mobileLayerEncryptedStorageStructure[key].parse(structData);
    }, []);

    return { get, set, remove };
}
