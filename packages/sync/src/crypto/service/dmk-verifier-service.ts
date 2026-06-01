import { ed25519_verify } from '../ed25519';
import type { EncryptedKeyRepository } from '../encrypted-key-repository';

export class DmkVerifierService {
    constructor(private readonly encryptedKeyRepository: EncryptedKeyRepository) {}

    public verify(sig: Buffer, data: Buffer): boolean {
        const ikPub = this.encryptedKeyRepository.getDMKPub();
        return ed25519_verify(sig, data, ikPub);
    }
}
