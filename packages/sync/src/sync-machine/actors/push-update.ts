import { fromPromise } from 'xstate';

import { SyncMachineConfig } from '../config';

export const pushUpdateToServer = fromPromise(async ({ input }: { input: SyncMachineConfig }) => {
    const encrypted = await input.updateEncryptor.encryptAndSign(input.yManager.encodeAsSnapshot());
    await input.snapshotsApi.saveSnapshot({
        snapshot: {
            kid: (await input.ikService.getKID()).toString('hex'),
            ciphertext: encrypted.ciphertext.toString('hex'),
            nonce: encrypted.nonce.toString('hex'),
            snapshotProof: encrypted.snapshotProof.toString('hex'),
            signature: encrypted.signature.toString('hex')
        }
    });

    await input.syncStateRepository.saveState({
        snapshotProof: encrypted.snapshotProof
    });
    input.logger.info(`Pushed new update ${encrypted.snapshotProof.toString('hex')}`);
});
