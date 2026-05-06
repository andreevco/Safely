import { fromPromise } from 'xstate';

import { StorageVersion } from '@safely/slottree';

import { hex } from '../../utils/buffer';
import { SyncMachineConfig } from '../config';
import { classifyError } from '../error-handler';

export const initialSyncing = fromPromise(
    async ({ input }: { input: SyncMachineConfig<StorageVersion, unknown> }) => {
        input.logger.info('Initial syncing: fetching latest snapshot from server...');
        const knownState = await input.syncStateRepository.getState();

        let lastState;
        try {
            lastState = await input.snapshotsApi.getActualSnapshot({
                withProofChainTo: knownState.snapshotProof.toString('hex')
            });
        } catch (e) {
            throw await classifyError(e);
        }
        input.logger.info(
            'Received snapshot from server, proof:',
            lastState.snapshot.snapshotProof.slice(0, 16) + '...'
        );

        try {
            return await input.updateHandler.handle({
                kid: hex(lastState.snapshot.kid),
                ciphertext: hex(lastState.snapshot.ciphertext),
                nonce: hex(lastState.snapshot.nonce),
                signature: hex(lastState.snapshot.signature),
                snapshotProof: hex(lastState.snapshot.snapshotProof),
                snapshotProofChain: lastState.proofChain
                    ? lastState.proofChain.proofChain.map(proof => hex(proof))
                    : []
            });
        } catch (e) {
            input.logger.error('Error during initial syncing', e);
            throw await classifyError(e);
        }
    }
);
