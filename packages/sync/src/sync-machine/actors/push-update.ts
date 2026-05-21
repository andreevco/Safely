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
        input.logger.info('Encrypting local snapshot to send to server...');
        try {
            await input.syncOperations.pushLocalSnapshot(signal);
        } catch (e) {
            throw await classifyError(e);
        }
        input.logger.info('Snapshot successfully sent to server');
    }
);
