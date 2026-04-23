import { fromPromise } from 'xstate';

import { SyncMachineConfig } from '../config';
import { classifyError } from '../error-handler';

export const pushUpdateToServer = fromPromise(async ({ input }: { input: SyncMachineConfig }) => {
    console.log('[Sync Push] Encrypting local snapshot to send to server...');
    const encrypted = await input.updateEncryptor.encryptAndSign(input.yManager.encodeAsSnapshot());
    console.log(
        '[Sync Push] Sending encrypted snapshot to server, proof:',
        encrypted.snapshotProof.toString('hex').slice(0, 16) + '...'
    );
    try {
        await input.snapshotsApi.saveSnapshot({
            snapshot: {
                kid: (await input.ikService.getKID()).toString('hex'),
                ciphertext: encrypted.ciphertext.toString('hex'),
                nonce: encrypted.nonce.toString('hex'),
                snapshotProof: encrypted.snapshotProof.toString('hex'),
                signature: encrypted.signature.toString('hex')
            }
        });
    } catch (e) {
        throw await classifyError(e);
    }
    console.log('[Sync Push] Snapshot successfully sent to server');

    const prevState = await input.syncStateRepository.getState();
    await input.syncStateRepository.saveState({
        initialized: prevState.initialized,
        snapshotProof: encrypted.snapshotProof
    });
    input.logger.info(`Pushed new update ${encrypted.snapshotProof.toString('hex')}`);
});
