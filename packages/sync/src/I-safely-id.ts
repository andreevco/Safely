import { ZodObject } from 'zod';

import { ISyncProvider } from './sync-provider/I-sync-provider';

export interface ISafelyId<S extends ZodObject> {
    id: string;
    syncProvider: ISyncProvider<S>;
}
