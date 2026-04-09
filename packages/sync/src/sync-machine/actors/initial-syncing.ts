import { fromPromise } from 'xstate';

import { hex } from '../../utils/buffer';
import { SyncMachineConfig } from '../config';
import { classifyError } from '../error-handler';

export const initialSyncing = fromPromise(async ({ input }: { input: SyncMachineConfig }) => {
    console.log('[Sync] Initial syncing: fetching latest snapshot from server...');
    const knownState = await input.syncStateRepository.getState();
    input.logger.info(`Initial sync ${knownState.snapshotProof.toString('hex')}`);

    let lastState;
    try {
        lastState = await input.snapshotsApi.getActualSnapshot({
            withProofChainTo: knownState.snapshotProof.toString('hex')
        });
    } catch (e) {
        throw await classifyError(e);
    }
    console.log(
        '[Sync] Initial syncing: received snapshot from server, proof:',
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
        console.error('[SyncMachine] Error during initial syncing', {
            isError: e instanceof Error,
            name: e instanceof Error ? e.name : undefined,
            message: e instanceof Error ? e.message : String(e)
        });
        throw await classifyError(e);
    }
});
