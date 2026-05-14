import { fromPromise } from 'xstate';

import type { StorageVersion } from '@safely/slottree';

import { encodeUpdatePayload } from '../../update-handler/update-payload';
import type { SyncMachineConfig } from '../config';
import { classifyError } from '../error-handler';

export const pushUpdateToServer = fromPromise(
    async ({ input }: { input: SyncMachineConfig<StorageVersion, unknown> }) => {
        input.logger.info('Encrypting local snapshot to send to server...');
        const encrypted = await input.updateEncryptor.encryptAndSign(
            encodeUpdatePayload({
                userStorage: input.yManager.encodeAsSnapshot(),
                deviceStorage: input.deviceYManager.encodeAsSnapshot()
            })
        );
        input.logger.info(
            'Sending encrypted snapshot to server, proof:',
            encrypted.snapshotProof.toString('hex').slice(0, 16) + '...'
        );
        try {
            await input.snapshotsApi.saveSnapshot({
                snapshot: {
                    kid: input.ikService.getKID().toString('hex'),
                    ciphertext: encrypted.ciphertext.toString('hex'),
                    nonce: encrypted.nonce.toString('hex'),
                    snapshotProof: encrypted.snapshotProof.toString('hex'),
                    signature: encrypted.signature.toString('hex')
                }
            });
        } catch (e) {
            throw await classifyError(e);
        }
        input.logger.info('Snapshot successfully sent to server');

        await input.syncStateRepository.saveState({
            snapshotProof: encrypted.snapshotProof
        });
    }
);
