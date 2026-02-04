import { z, ZodType } from 'zod';

import { SyncError } from '../sync-error';

export interface ISyncProvider<S extends Record<string, ZodType>> {
    structure: S;
    type: 'online' | 'offline';

    get<K extends keyof S>(k: K): Promise<z.output<S[K]>>;
    set<K extends keyof S>(k: K, v: z.input<S[K]> | string): Promise<void>;
    remove(k: keyof S): Promise<void>;
    onChange<K extends keyof S>(k: K, observer: (v: z.output<S[K]>) => void): () => void;
    onError(obs: (e: SyncError) => void): () => void;
    dispose(): void;

    /**
     * This method forces sending update to the server.
     * This method is mainly for debug purposes.
     */
    triggerSync(): Promise<void>;
}
