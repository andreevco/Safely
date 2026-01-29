import { createMMKV } from 'react-native-mmkv';

const mmkv = createMMKV({ id: 'safely-app' });

/**
 * MMKV storage adapter compatible with createPersister from @safely/ux
 */
export const mmkvStorage = {
    getItem: (key: string) => mmkv.getString(key) ?? null,
    setItem: (key: string, value: string) => mmkv.set(key, value),
    removeItem: (key: string) => mmkv.delete(key)
};
