import { z } from 'zod';

import { BufferHexSchema } from '../utils/schemas';

export type SyncState = {
    initialized: boolean;
    snapshotProof: Buffer;
};

export const SyncStateSchema = z.object({
    initialized: z.boolean(),
    snapshotProof: BufferHexSchema
});

export function syncStateToJson(syncState: SyncState): string {
    return JSON.stringify({
        initialized: syncState.initialized,
        snapshotProof: syncState.snapshotProof.toString('hex')
    });
}
