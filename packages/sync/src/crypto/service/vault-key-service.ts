import { xchacha20poly1305 } from '@noble/ciphers/chacha.js';

import { saf751, saf751Sync } from '../../utils/saf751-trace';
import type { SecureEncryptedKeyRepository } from '../secure-encrypted-key-repository';

export class VaultKeyService {
    constructor(private readonly keyRepository: SecureEncryptedKeyRepository) {}

    public async encrypt(data: Buffer): Promise<{ ciphertext: Buffer; nonce: Buffer }> {
        const nonce = saf751Sync('sync.vaultKey.randomNonce', () =>
            crypto.getRandomValues(new Uint8Array(24))
        );

        const encryptionKey = await this.keyRepository.getVaultKey();

        saf751('sync.vaultKey.keyReady', { keyBytes: encryptionKey.byteLength });

        const ciphertext = saf751Sync(
            'sync.vaultKey.xchacha.encrypt',
            () => xchacha20poly1305(encryptionKey, nonce).encrypt(data),
            { dataBytes: data.byteLength }
        );
        encryptionKey.fill(0);

        return { ciphertext: Buffer.from(ciphertext), nonce: Buffer.from(nonce) };
    }

    public async decrypt(ciphertext: Buffer, nonce: Buffer): Promise<Buffer> {
        const decryptionKey = await this.keyRepository.getVaultKey();
        const decrypted = saf751Sync(
            'sync.vaultKey.xchacha.decrypt',
            () => xchacha20poly1305(decryptionKey, nonce).decrypt(ciphertext),
            { dataBytes: ciphertext.byteLength }
        );
        decryptionKey.fill(0);
        return Buffer.from(decrypted);
    }
}
