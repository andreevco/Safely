import { z } from 'zod';

import { BufferHexSchema } from '../utils/schemas';

export type SyncState = {
    snapshotProof: Buffer;
};

export const SyncStateSchema = z.object({
    snapshotProof: BufferHexSchema
});

export function syncStateToJson(syncState: SyncState): string {
    return JSON.stringify({
        snapshotProof: syncState.snapshotProof.toString('hex')
    });
}
