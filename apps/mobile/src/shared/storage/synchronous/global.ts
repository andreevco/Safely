import { useCallback, useSyncExternalStore } from 'react';
import z from 'zod';

// eslint-disable-next-line boundaries/element-types
import { mobileLayerSynchronousGlobal } from '@mobile/app/storage';

const mobileLayerSynchronousGlobalStructure = {
    devToken: z.string().nullable(),
    devIsTestnetAllowed: z.boolean().nullable(),
    devCountryCode: z.string().nullable()
};

type MobileLayerSynchronousGlobalStructure = typeof mobileLayerSynchronousGlobalStructure;
type StorageKey = keyof MobileLayerSynchronousGlobalStructure;

const { storage, mmkv } = mobileLayerSynchronousGlobal;

function get<K extends StorageKey>(key: K): z.output<MobileLayerSynchronousGlobalStructure[K]> {
    const raw = storage.get(key);
    const data: unknown = raw === null ? null : JSON.parse(raw);

    return mobileLayerSynchronousGlobalStructure[key].parse(data) as z.output<
        MobileLayerSynchronousGlobalStructure[K]
    >;
}

function set<K extends StorageKey>(
    key: K,
    value: z.input<MobileLayerSynchronousGlobalStructure[K]>
): void {
    mobileLayerSynchronousGlobalStructure[key].parse(value);
    storage.set(key, JSON.stringify(value));
}

function remove(key: StorageKey): void {
    storage.remove(key);
}

export function useMobileLayerSynchronousGlobalStorage<K extends StorageKey>(key: K) {
    const subscribe = useCallback(
        (onStoreChange: () => void) => {
            const listener = mmkv.addOnValueChangedListener(changedKey => {
                if (changedKey === key) onStoreChange();
            });

            return () => listener.remove();
        },
        [key]
    );

    const value = useSyncExternalStore(subscribe, () => get(key));

    const setValue = useCallback(
        (val: z.input<MobileLayerSynchronousGlobalStructure[K]>) => set(key, val),
        [key]
    );

    const removeValue = useCallback(() => remove(key), [key]);

    return { value, set: setValue, remove: removeValue };
}
