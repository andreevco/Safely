import { sha256 } from '@noble/hashes/sha2.js';

import { ed25519_sign, ed25519_verify } from '../ed25519';
import type { EncryptedKeyRepository } from '../encrypted-key-repository';

export interface IIkService {
    sign(data: Buffer): Promise<Buffer>;
    verify(data: Buffer, sig: Buffer): Promise<boolean>;
    getPub(): Promise<Buffer>;
}

export class IkService implements IIkService {
    constructor(private readonly keyRepository: EncryptedKeyRepository) {}

    public async sign(data: Buffer): Promise<Buffer> {
        const ik = await this.keyRepository.getIKPrv();
        if (ik === null) {
            throw new Error('Identity key not found.');
        }
        const sig = ed25519_sign(data, ik);
        ik.fill(0);
        return Buffer.from(sig);
    }

    public async verify(data: Buffer, sig: Buffer): Promise<boolean> {
        const ikPub = await this.keyRepository.getIKPub();
        return ed25519_verify(sig, data, ikPub);
    }

    public async getPub(): Promise<Buffer> {
        return this.keyRepository.getIKPub();
    }

    public async getKID(): Promise<Buffer> {
        const ikPub = await this.keyRepository.getIKPub();
        return Buffer.from(sha256(ikPub)).slice(0, 16);
    }
}
