import { fromPromise } from 'xstate';

import type { StorageVersion } from '@safely/slottree';

import { SyncStatus } from '../../sync-provider/sync-status';
import type { SyncMachineConfig } from '../config';
import { classifyError, SyncMachineError } from '../error-handler';

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

        let result;
        try {
            result = await input.config.syncOperations.applyRemoteUpdate(
                {
                    snapshotProofChain: [],
                    ...upd
                },
                signal
            );
            input.config.logger.info('Remote update applied successfully');
        } catch (e) {
            input.config.logger.error('Error applying update', e);
            throw await classifyError(e);
        }
        if (result.revoked) {
            throw new SyncMachineError({
                type: 'fatal',
                status: SyncStatus.DEVICE_DELETED
            });
        }
        return result;
    }
);
