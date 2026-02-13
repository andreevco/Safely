import { createMMKV } from 'react-native-mmkv';

import { IEnumerableStorage, TreeStorage } from '@safely/core';

export function createMMKVTreeStorage(id: string) {
    const mmkv = createMMKV({ id });
    const enumerableStorage: IEnumerableStorage = {
        getItem: async (key: string) => mmkv.getString(key) ?? null,
        setItem: async (key: string, value: string) => mmkv.set(key, value),
        removeItem: async (key: string) => {
            mmkv.remove(key);
        },
        clear: async () => mmkv.clearAll(),
        getAllKeys: async () => mmkv.getAllKeys()
    };

    const storage = TreeStorage.root(enumerableStorage);

    return {
        storage,
        mmkv
    };
}

export class MobileLocaleStorage {
    private static readonly mmkv = createMMKV({ id: 'locale' });

    public static get(): string | null {
        return this.mmkv.getString('locale') ?? null;
    }

    public static set(locale: string): void {
        this.mmkv.set('locale', locale);
    }
}

export function clearAllAppData() {
    createMMKV({ id: 'app' }).clearAll();
    createMMKV({ id: 'persister' }).clearAll();
}
