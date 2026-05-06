import { z, ZodObject } from 'zod';

import { SyncError } from '../sync-error';
import { ISyncStatusManager } from './sync-status';

type ShapeOf<S extends z.ZodObject<z.ZodRawShape>> = S['shape'];
type SchemaKey<S extends z.ZodObject<z.ZodRawShape>> = Extract<keyof ShapeOf<S>, string>;

export interface ISyncProvider<S extends ZodObject> {
    syncStatusManager: ISyncStatusManager;

    get<K extends SchemaKey<S>>(key: K): z.output<ShapeOf<S>[K]>;
    getAll(): z.output<S>;
    set<K extends SchemaKey<S>>(key: K, value: z.input<ShapeOf<S>[K]>): Promise<void>;
    onChange<K extends SchemaKey<S>>(
        key: K,
        observer: (value: z.output<ShapeOf<S>[K]>) => void
    ): () => void;
    onError(obs: (e: SyncError) => void): () => void;
    dispose(): void;
    restart(): void;

    /**
     * This method forces sending update to the server.
     * This method is mainly for debug purposes.
     */
    triggerSync(): void;
}
