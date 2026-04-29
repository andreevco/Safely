import * as SecureStore from 'expo-secure-store';
import { createMMKV } from 'react-native-mmkv';

import {
    EnumerableStorage,
    IEnumerableStorage,
    IStorage,
    ISyncSingleStorage,
    OptionalProperty,
    TreeStorage
} from '@safely/core';

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

function createEncryptedEnumerableStorage(
    keychainService: string,
    keychainAccessible: SecureStore.KeychainAccessibilityConstant
): IEnumerableStorage {
    const options: SecureStore.SecureStoreOptions = {
        keychainService,
        keychainAccessible,
        requireAuthentication: false
    };

    const dataStorage: OptionalProperty<IStorage, 'clear'> = {
        getItem: key => SecureStore.getItemAsync(key, options),
        setItem: async (key, value) => {
            await SecureStore.setItemAsync(key, value, options);
        },
        removeItem: async key => {
            await SecureStore.deleteItemAsync(key, options);
        }
    };

    const metaStorage = createMMKVTreeStorage('keychain-meta').storage.child(keychainService);

    return new EnumerableStorage(dataStorage, metaStorage);
}

function createSecureStoreTreeStorage(
    keychainService: string,
    keychainAccessible: SecureStore.KeychainAccessibilityConstant
) {
    return {
        storage: TreeStorage.root(
            createEncryptedEnumerableStorage(keychainService, keychainAccessible)
        )
    };
}

export const mobileStorages = {
    app: createMMKVTreeStorage('app'),
    encrypted: createSecureStoreTreeStorage(
        'safely.encrypted',
        SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY
    ),
    secureEncrypted: createSecureStoreTreeStorage(
        'safely.secureEncrypted',
        SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY
    ),
    persister: createMMKVEnumerableStorage('persister'),
    locale: createMMKVSyncSingleStorage('locale')
};
