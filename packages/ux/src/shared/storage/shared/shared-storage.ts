import { useCallback } from 'react';
import z, { ZodType } from 'zod';

import { IStorage } from '@safely/core';

import { sharedStorageStructure, SharedStorageStructure } from './schemas';
import { useAppContext } from '../../providers';
import { useStorageFactory } from '../storage-factory';

export function useSharedStructuredStorage<K extends keyof SharedStorageStructure>(key: K) {
    const storageFactory = useStorageFactory();
    const sharedStorage = storageFactory.shared.child('structured');

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

        return sharedStorageStructure[key].parse(structData);
    }, [sharedStorage]);

    return { get, set, remove };
}

export function useSharedUnstructuredStorage<T extends ZodType>(key: string, scheme: T) {
    const storageFactory = useStorageFactory();
    const sharedStorage = storageFactory.shared.child('unstructured');

    return _useSharedUnstructuredStorage(key, scheme, sharedStorage);
}

export function useSharedUnstructuredKeychainStorage<T extends ZodType>(key: string, scheme: T) {
    const { encryptedStorage } = useAppContext();
    const keychainStorage = encryptedStorage.child('unstructured');

    return _useSharedUnstructuredStorage(key, scheme, keychainStorage);
}

function _useSharedUnstructuredStorage<T extends ZodType>(
    key: string,
    scheme: T,
    storage: IStorage
) {
    const set = useCallback<(val: z.input<T>) => Promise<void>>(
        val => {
            return storage.setItem(key, JSON.stringify(val));
        },
        [storage]
    );

    const remove = useCallback<() => Promise<void>>(() => {
        return storage.removeItem(key);
    }, [storage]);

    const get = useCallback<() => Promise<z.output<T> | null>>(async () => {
        const data = await storage.getItem(key);
        const structData: unknown = data === null ? null : JSON.parse(data);

        if (structData === null) {
            return null;
        }

        return scheme.parse(structData);
    }, [storage]);

    return { get, set, remove };
}
