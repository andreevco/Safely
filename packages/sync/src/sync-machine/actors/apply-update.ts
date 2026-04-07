import { fromPromise } from 'xstate';

import { SyncMachineConfig } from '../config';
import { classifyError } from '../error-handler';

export const applyUpdate = fromPromise(
    async ({ input }: { input: { config: SyncMachineConfig } }) => {
        const upd = input.config.remoteUpdates[0] ?? null;
        if (upd === null) return;
        console.log(
            '[Sync Pull] Applying remote update, proof:',
            upd.snapshotProof.toString('hex').slice(0, 16) + '...'
        );
        try {
            await input.config.updateHandler.handle({
                snapshotProofChain: [],
                ...upd
            });
            console.log('[Sync Pull] Remote update applied successfully');
        } catch (e) {
            console.error('[SyncMachine] Error applying update', e);
            throw await classifyError(e);
        }
    }
);
