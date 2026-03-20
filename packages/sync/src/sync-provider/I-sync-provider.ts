import { z, ZodType } from 'zod';

import { SyncError } from '../sync-error';

export interface ISyncProvider<S extends Record<string, ZodType>> {
    structure: S;
    type: 'online' | 'offline';

    get<K extends keyof S>(k: K): z.output<S[K]>;
    getAll(): { [K in keyof S]: z.output<S[K]> };
    set<K extends keyof S>(k: K, v: z.input<S[K]> | string): Promise<void>;
    remove(k: keyof S): Promise<void>;
    onChange<K extends keyof S>(k: K, observer: (v: z.output<S[K]>) => void): () => void;
    onError(obs: (e: SyncError) => void): () => void;
    dispose(): void;
    restart(): void;

    /**
     * Resolves when the initial sync is complete (data is available).
     * For offline providers, resolves immediately.
     */
    waitForInitialSync(): Promise<void>;

    /**
     * This method forces sending update to the server.
     * This method is mainly for debug purposes.
     */
    triggerSync(): void;
}
