import type { ZodType } from 'zod';

import type { ISyncProvider } from './sync-provider/I-sync-provider';

export interface ISafelyId<S extends Record<string, ZodType>> {
    id: string;
    syncProvider: ISyncProvider<S>;
}
