import { utf8 } from '../../utils/buffer';
import { ed25519_sign } from '../ed25519';
import type { SecureEncryptedKeyRepository } from '../secure-encrypted-key-repository';

export class DmkSignerService {
    constructor(private readonly keyRepository: SecureEncryptedKeyRepository) {}

    public async sign(data: Buffer): Promise<Buffer> {
        const ik = await this.keyRepository.getDMKPrv();
        if (ik === null) {
            throw new Error('Identity key not found.');
        }
        const sig = ed25519_sign(data, ik);
        ik.fill(0);
        return sig;
    }

    public async signRevokeMessageForServer(ikPub: Buffer): Promise<Buffer> {
        const toSign = Buffer.concat([
            utf8('safely/sync/v1/server/revoke_device'),
            Buffer.from([0x00]),
            ikPub
        ]);
        return await this.sign(toSign);
    }
}
