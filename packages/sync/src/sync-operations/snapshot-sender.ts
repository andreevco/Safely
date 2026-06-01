import type { StorageVersion } from '@safely/slottree';

import type { SnapshotsApi } from '../api/generated';
import type { EncryptedState } from '../api/types';
import type { YManager } from '../crdt/y-manager';
import type { IkService } from '../crypto/service/ik-service';
import type { tDevicesLatest, tDevicesRest } from '../device-manager/device-storage-schema';
import type { UpdateEncryptorService } from '../update-encryptor/update-encryptor-service';
import type { SyncStateRepository } from '../update-handler/sync-state-repository';
import { encodeUpdatePayload } from '../update-handler/update-payload';

export class SnapshotSender<Latest extends StorageVersion, Rest> {
    constructor(
        private readonly updateEncryptor: UpdateEncryptorService,
        private readonly yManager: YManager<Latest, Rest>,
        private readonly deviceYManager: YManager<tDevicesLatest, tDevicesRest>,
        private readonly syncStateRepository: SyncStateRepository,
        private readonly snapshotsApi: SnapshotsApi,
        private readonly ikService: IkService
    ) {}

    public async sendCurrentSnapshot(signal?: AbortSignal): Promise<void> {
        const encrypted = await this.updateEncryptor.encryptAndSign(
            encodeUpdatePayload({
                userStorage: this.yManager.encodeAsSnapshot(),
                deviceStorage: this.deviceYManager.encodeAsSnapshot()
            })
        );
        await this.saveEncryptedSnapshot(encrypted, signal);
    }

    private async saveEncryptedSnapshot(
        encrypted: EncryptedState,
        signal?: AbortSignal
    ): Promise<void> {
        await this.snapshotsApi.saveSnapshot(
            {
                snapshot: {
                    kid: this.ikService.getKID().toString('hex'),
                    ciphertext: encrypted.ciphertext.toString('hex'),
                    nonce: encrypted.nonce.toString('hex'),
                    snapshotProof: encrypted.snapshotProof.toString('hex'),
                    signature: encrypted.signature.toString('hex')
                }
            },
            {
                signal
            }
        );

        await this.syncStateRepository.saveState({
            snapshotProof: encrypted.snapshotProof
        });
    }
}
