import { EncryptedState } from '../api/types';
import { SyncKeyService } from '../crypto/service/sync-key-service';
import { DeviceManagementService } from '../device-manager/device-management-service';

export class UpdateDecryptorService {
    constructor(
        private readonly syncKeyService: SyncKeyService,
        private readonly deviceManager: DeviceManagementService
    ) {}

    public async decrypt(state: EncryptedState): Promise<Buffer> {
        return await this.syncKeyService.decrypt(state.ciphertext, state.nonce);
    }

    public async verifyIKSig(state: EncryptedState): Promise<void> {
        const isValid = await this.deviceManager.verifyDeviceIKSig({
            kid: state.kid,
            sig: state.signature,
            data: Buffer.concat([state.nonce, state.ciphertext, state.snapshotProof])
        });
        if (!isValid) {
            throw new Error('Invalid snapshot IK signature');
        }
    }
}
