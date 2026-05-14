import type { SnapshotsApi } from '../api/generated';
import type { EncryptedState } from '../api/types';
import type { YManager } from '../crdt/y-manager';
import type { IkService } from '../crypto/service/ik-service';
import type { UpdateEncryptorService } from '../update-encryptor/update-encryptor-service';
import type { SyncStateRepository } from '../update-handler/sync-state-repository';

export class SnapshotSender {
    constructor(
        private readonly updateEncryptor: UpdateEncryptorService,
        private readonly yManager: YManager,
        private readonly syncStateRepository: SyncStateRepository,
        private readonly snapshotsApi: SnapshotsApi,
        private readonly ikService: IkService
    ) {}

    public async sendCurrentSnapshot(): Promise<void> {
        const encrypted = await this.updateEncryptor.encryptAndSign(
            this.yManager.encodeAsSnapshot()
        );
        await this.saveEncryptedSnapshot(encrypted);
    }

    private async saveEncryptedSnapshot(encrypted: EncryptedState): Promise<void> {
        await this.snapshotsApi.saveSnapshot({
            snapshot: {
                kid: (await this.ikService.getKID()).toString('hex'),
                ciphertext: encrypted.ciphertext.toString('hex'),
                nonce: encrypted.nonce.toString('hex'),
                snapshotProof: encrypted.snapshotProof.toString('hex'),
                signature: encrypted.signature.toString('hex')
            }
        });

        await this.syncStateRepository.saveState({
            snapshotProof: encrypted.snapshotProof
        });
    }
}
