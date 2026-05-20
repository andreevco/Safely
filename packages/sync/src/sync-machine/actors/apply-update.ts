import { fromPromise } from 'xstate';

import type { StorageVersion } from '@safely/slottree';

import type { SyncMachineConfig } from '../config';
import { classifyError } from '../error-handler';

export const applyUpdate = fromPromise(
    async ({
        input,
        signal
    }: {
        input: { config: SyncMachineConfig<StorageVersion, unknown> };
        signal: AbortSignal;
    }) => {
        const upd = input.config.remoteUpdates[0] ?? null;
        if (upd === null) return { hasLocalChanges: false };
        input.config.logger.info(
            'Applying remote update, proof:',
            upd.snapshotProof.toString('hex').slice(0, 16) + '...'
        );
        try {
            const result = await input.config.syncOperations.applyRemoteUpdate(
                {
                    snapshotProofChain: [],
                    ...upd
                },
                signal
            );
            input.config.logger.info('Remote update applied successfully');
            return result;
        } catch (e) {
            input.config.logger.error('Error applying update', e);
            throw await classifyError(e);
        }
    }
);
