import { xchacha20poly1305 } from '@noble/ciphers/chacha.js';

import type { SecureEncryptedKeyRepository } from '../secure-encrypted-key-repository';

export class VaultKeyService {
    constructor(private readonly keyRepository: SecureEncryptedKeyRepository) {}

    public async encrypt(data: Buffer): Promise<{ ciphertext: Buffer; nonce: Buffer }> {
        const nonce = crypto.getRandomValues(new Uint8Array(24));

        const encryptionKey = await this.keyRepository.getVaultKey();
        const ciphertext = xchacha20poly1305(encryptionKey, nonce).encrypt(data);
        encryptionKey.fill(0);

        return { ciphertext: Buffer.from(ciphertext), nonce: Buffer.from(nonce) };
    }

    public async decrypt(ciphertext: Buffer, nonce: Buffer): Promise<Buffer> {
        const decryptionKey = await this.keyRepository.getVaultKey();
        const decrypted = xchacha20poly1305(decryptionKey, nonce).decrypt(ciphertext);
        decryptionKey.fill(0);
        return Buffer.from(decrypted);
    }
}
