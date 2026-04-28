import { fromPromise } from 'xstate';

import { SyncMachineConfig } from '../config';
import { classifyError } from '../error-handler';

export const applyUpdate = fromPromise(
    async ({ input }: { input: { config: SyncMachineConfig } }) => {
        const upd = input.config.remoteUpdates[0] ?? null;
        if (upd === null) return;
        input.config.logger.info(
            'Applying remote update, proof:',
            upd.snapshotProof.toString('hex').slice(0, 16) + '...'
        );
        try {
            await input.config.updateHandler.handle({
                snapshotProofChain: [],
                ...upd
            });
            input.config.logger.info('Remote update applied successfully');
        } catch (e) {
            input.config.logger.error('Error applying update', e);
            throw await classifyError(e);
        }
    }
);
