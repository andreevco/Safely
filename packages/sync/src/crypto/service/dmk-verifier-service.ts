import { ed25519_verify } from '../ed25519';
import { EncryptedKeyRepository } from '../encrypted-key-repository';

export class DmkVerifierService {
    constructor(private readonly encryptedKeyRepository: EncryptedKeyRepository) {}

    public async verify(sig: Buffer, data: Buffer): Promise<boolean> {
        const ikPub = await this.encryptedKeyRepository.getDMKPub();
        return ed25519_verify(sig, data, ikPub);
    }
}
