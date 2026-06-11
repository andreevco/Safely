import { fromPromise } from 'xstate';

import type { StorageVersion } from '@safely/slottree';

import { SyncFlowLogger } from '../../logger';
import { SyncStatus } from '../../sync-provider/sync-status';
import { hex } from '../../utils/buffer';
import type { SyncMachineConfig } from '../config';
import { classifyError, SyncMachineError } from '../error-handler';

export const initialSyncing = fromPromise(
    async ({
        input,
        signal
    }: {
        input: SyncMachineConfig<StorageVersion, unknown>;
        signal: AbortSignal;
    }) => {
        const flow = SyncFlowLogger.start(input.logger, 'sync_machine.initial_sync');
        const knownState = await input.syncStateRepository.getState();

        let lastState;
        try {
            lastState = await input.snapshotsApi.getActualSnapshot(
                {
                    withProofChainTo: knownState.snapshotProof.toString('hex')
                },
                {
                    signal
                }
            );
        } catch (e) {
            flow.logFail(e, 'fetch.failed');
            throw await classifyError(e);
        }
        const remoteUpdate = {
            kid: hex(lastState.snapshot.kid),
            ciphertext: hex(lastState.snapshot.ciphertext),
            nonce: hex(lastState.snapshot.nonce),
            signature: hex(lastState.snapshot.signature),
            snapshotProof: hex(lastState.snapshot.snapshotProof),
            snapshotProofChain: lastState.proofChain
                ? lastState.proofChain.proofChain.map(proof => hex(proof))
                : []
        };

        let result;
        try {
            result = await input.syncOperations.applyRemoteUpdate(
                remoteUpdate,
                signal,
                flow.child('update_handler', {
                    snapshotProof: remoteUpdate.snapshotProof.toString('hex').slice(0, 16)
                })
            );
        } catch (e) {
            flow.logFail(e, 'apply.failed');
            throw await classifyError(e);
        }
        if (result.revoked) {
            flow.logIncomplete('revoked');
            throw new SyncMachineError({
                type: 'fatal',
                status: SyncStatus.DEVICE_DELETED
            });
        }
        flow.logEnd('completed', {
            hasLocalChanges: result.hasLocalChanges
        });
        return result;
    }
);
