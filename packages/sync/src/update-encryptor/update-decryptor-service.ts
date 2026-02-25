import { EncryptedState } from '../api/types';
import { SyncKeyService } from '../crypto/service/sync-key-service';
import { DeviceManagementService } from '../device-manager/device-management-service';

export class UpdateDecryptorService {
    constructor(
        private readonly syncKeyService: SyncKeyService,
        private readonly deviceManager: DeviceManagementService
    ) {}

    public async verifyAndDecrypt(state: EncryptedState): Promise<Buffer> {
        await this.deviceManager.verifyDeviceIKSig({
            kid: state.kid,
            sig: state.signature,
            data: Buffer.concat([state.nonce, state.ciphertext, state.snapshotProof])
        });

        return await this.syncKeyService.decrypt(state.ciphertext, state.nonce);
    }
}
