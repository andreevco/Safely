import type { EncryptedState } from '../api/types';
import type { SyncKeyService } from '../crypto/service/sync-key-service';

export class UpdateDecryptorService {
    constructor(private readonly syncKeyService: SyncKeyService) {}

    public async decrypt(state: EncryptedState): Promise<Buffer> {
        return await this.syncKeyService.decrypt(state.ciphertext, state.nonce);
    }
}
