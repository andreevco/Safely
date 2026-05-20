import type { ZodObject } from 'zod';

import type { ISyncProvider } from './sync-provider/I-sync-provider';

export interface ISafelyId<S extends ZodObject> {
    id: string;
    syncProvider: ISyncProvider<S>;
}
