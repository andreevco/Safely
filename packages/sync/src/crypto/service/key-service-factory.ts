import { DmkSignerService } from './dmk-signer-service';
import type { ITreeStorage } from '../../I-storage';
import { SecureEncryptedKeyRepository } from '../secure-encrypted-key-repository';
import { MasterKeyService } from './master-key-service';
import { VaultKeyService } from './vault-key-service';
import { getSyncAccountStorage } from '../../account/sync-account-storage';

export class KeyServiceFactory {
    constructor(private readonly accountId: string) {}

    public createDmkSignerService(secureEncryptedStorage: ITreeStorage) {
        const storage = getSyncAccountStorage(secureEncryptedStorage, this.accountId);
        const secureEncryptedRepository = new SecureEncryptedKeyRepository(storage);
        return new DmkSignerService(secureEncryptedRepository);
    }

    public createMasterKeyService(secureEncryptedStorage: ITreeStorage) {
        const storage = getSyncAccountStorage(secureEncryptedStorage, this.accountId);
        const secureEncryptedRepository = new SecureEncryptedKeyRepository(storage);
        return new MasterKeyService(secureEncryptedRepository);
    }

    public createVaultKeyService(secureEncryptedStorage: ITreeStorage) {
        const storage = getSyncAccountStorage(secureEncryptedStorage, this.accountId);
        const secureEncryptedRepository = new SecureEncryptedKeyRepository(storage);
        return new VaultKeyService(secureEncryptedRepository);
    }
}
