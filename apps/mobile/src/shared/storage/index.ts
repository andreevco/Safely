import { createMMKV } from 'react-native-mmkv';

import { IEnumerableStorage, ISyncSingleStorage, TreeStorage } from '@safely/core';

function createMMKVEnumerableStorage(id: string) {
    const mmkv = createMMKV({ id });
    const storage: IEnumerableStorage = {
        getItem: async (key: string) => mmkv.getString(key) ?? null,
        setItem: async (key: string, value: string) => mmkv.set(key, value),
        removeItem: async (key: string) => {
            mmkv.remove(key);
        },
        clear: async () => mmkv.clearAll(),
        getAllKeys: async () => mmkv.getAllKeys()
    };

    return {
        storage,
        mmkv
    };
}

function createMMKVTreeStorage(id: string) {
    const { storage: enumerableStorage, mmkv } = createMMKVEnumerableStorage(id);

    const storage = TreeStorage.root(enumerableStorage);

    return {
        storage,
        mmkv
    };
}

function createMMKVSyncSingleStorage(id: string) {
    const mmkv = createMMKV({ id });
    const storage: ISyncSingleStorage = {
        get: () => mmkv.getString(id) ?? null,
        set: (value: string) => mmkv.set(id, value),
        clear: () => mmkv.remove(id)
    };

    return {
        storage,
        mmkv
    };
}

export const mobileStorages = {
    app: createMMKVTreeStorage('app'),
    encrypted: createMMKVTreeStorage('encrypted'),
    secureEncrypted: createMMKVTreeStorage('secureEncrypted'),
    persister: createMMKVEnumerableStorage('persister'),
    locale: createMMKVSyncSingleStorage('locale')
};
