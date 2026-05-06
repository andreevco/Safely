import type { SecureEncryptedKeyRepository } from '../secure-encrypted-key-repository';

export class MasterKeyService {
    constructor(private readonly keyRepository: SecureEncryptedKeyRepository) {}

    public async withMasterKey<T>(f: (masterKey: Buffer) => Promise<T> | T): Promise<T> {
        const masterKey = await this.keyRepository.getMasterKey();
        try {
            const res = await f(masterKey);
            masterKey.fill(0);
            return res;
        } catch (error) {
            masterKey.fill(0);
            throw error;
        }
    }
}
