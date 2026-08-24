import type { z } from 'zod';

import type { DesktopStoreBridge } from '../../../shared/bridge';

type Structure = Record<string, z.ZodType>;

export type StructuredStorage<S extends Structure> = {
    get<K extends keyof S & string>(key: K): Promise<z.output<S[K]>>;
    set<K extends keyof S & string>(key: K, value: z.input<S[K]>): Promise<void>;
    remove<K extends keyof S & string>(key: K): Promise<void>;
};

export function createStructuredStorage<S extends Structure>(
    store: DesktopStoreBridge,
    structure: S
): StructuredStorage<S> {
    return {
        async get(key) {
            const stored = await store.get(key);
            const parsed: unknown = stored === null ? null : JSON.parse(stored);

            return structure[key].parse(parsed);
        },
        set(key, value) {
            structure[key].parse(value);

            return store.set(key, JSON.stringify(value));
        },
        remove(key) {
            return store.remove(key);
        }
    };
}
