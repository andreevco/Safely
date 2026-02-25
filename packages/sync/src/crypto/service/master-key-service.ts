import { KeyRepository } from '../key-repository';

export class MasterKeyService {
    constructor(private readonly keyRepository: KeyRepository) {}

    public async withMasterKey<T>(f: (masterKey: Buffer) => T): Promise<T> {
        const masterKey = await this.keyRepository.getMasterKey();
        try {
            const res = f(masterKey);
            masterKey.fill(0);
            return res;
        } catch (error) {
            masterKey.fill(0);
            throw error;
        }
    }
}
