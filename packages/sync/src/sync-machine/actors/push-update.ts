import { fromPromise } from 'xstate';

import type { StorageVersion } from '@safely/slottree';

import type { SyncMachineConfig } from '../config';
import { classifyError } from '../error-handler';

export const pushUpdateToServer = fromPromise(
    async ({
        input,
        signal
    }: {
        input: SyncMachineConfig<StorageVersion, unknown>;
        signal: AbortSignal;
    }) => {
        try {
            await input.syncOperations.pushLocalSnapshot(signal);
        } catch (e) {
            input.logger.error('sync_machine.push_update.failed', e);
            throw await classifyError(e);
        }
        input.logger.info('sync_machine.push_update.succeeded');
    }
);
