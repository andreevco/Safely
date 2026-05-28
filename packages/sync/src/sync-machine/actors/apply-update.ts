import { fromPromise } from 'xstate';

import type { StorageVersion } from '@safely/slottree';

import { SyncFlowLogger } from '../../logger';
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
        const flow = new SyncFlowLogger(input.config.logger, 'sync_machine.apply_update');
        flow.logStep('received', {
            snapshotProof: upd.snapshotProof.toString('hex').slice(0, 16)
        });

        let result;
        try {
            result = await input.config.syncOperations.applyRemoteUpdate(
                {
                    snapshotProofChain: [],
                    ...upd
                },
                signal
            );
        } catch (e) {
            flow.logFail(e, 'failed');
            throw await classifyError(e);
        }
        if (result.revoked) {
            flow.logIncomplete('revoked');
            throw new SyncMachineError({
                type: 'fatal',
                status: SyncStatus.DEVICE_DELETED
            });
        }
        flow.logEnd('applied', {
            hasLocalChanges: result.hasLocalChanges
        });
        return result;
    }
);
