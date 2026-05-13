import type { z, ZodType } from 'zod';

import type { SyncError } from '../sync-error';
import type { ISyncStatusManager } from './sync-status';

export interface ISyncProvider<S extends Record<string, ZodType>> {
    structure: S;
    syncStatusManager: ISyncStatusManager;

    get<K extends keyof S>(k: K): z.output<S[K]>;
    getAll(): { [K in keyof S]: z.output<S[K]> };
    set<K extends keyof S>(k: K, v: z.input<S[K]> | string): Promise<void>;
    remove(k: keyof S): Promise<void>;
    onChange<K extends keyof S>(k: K, observer: (v: z.output<S[K]>) => void): () => void;
    onError(obs: (e: SyncError) => void): () => void;
    dispose(): void;
    restart(options?: { preserveStatus?: boolean }): void;

    /**
     * This method forces sending update to the server.
     * This method is mainly for debug purposes.
     */
    triggerSync(): void;
}
