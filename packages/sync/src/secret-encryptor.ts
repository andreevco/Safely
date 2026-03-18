import { z } from 'zod';

import { KeyServiceFactory } from './crypto/service/key-service-factory';
import { ITreeStorage } from './I-storage';
import { hex } from './utils/buffer';

export const sSecretEncrypted = z.string();
export type SSecretEncrypted = z.infer<typeof sSecretEncrypted>;

export const sSecretDecrypted = z.string();
export type SSecretDecrypted = z.infer<typeof sSecretDecrypted>;

export interface ISecretEncryptor {
    encrypt(
        decryptedSecret: SSecretDecrypted,
        secureEncryptedStorage: ITreeStorage
    ): Promise<SSecretEncrypted>;
    decrypt(
        encryptedSecret: SSecretEncrypted,
        secureEncryptedStorage: ITreeStorage
    ): Promise<SSecretDecrypted>;
}

export class SecretEncryptor implements ISecretEncryptor {
    constructor(private readonly keyServiceFactory: KeyServiceFactory) {}

    public async encrypt(plaintext: string, secureEncryptedStorage: ITreeStorage): Promise<string> {
        const { ciphertext, nonce } = await this.keyServiceFactory
            .createVaultKeyService(secureEncryptedStorage)
            .encrypt(Buffer.from(plaintext, 'utf8'));
        const result = Buffer.concat([
            Buffer.from([0x01]), // version
            nonce,
            ciphertext
        ]);
        return result.toString('hex');
    }

    public async decrypt(
        encryptedPayload: string,
        secureEncryptedStorage: ITreeStorage
    ): Promise<string> {
        const data = hex(encryptedPayload);
        const version = data[0];
        if (version !== 0x01) {
            throw new Error(`Unsupported version: ${version}`);
        }
        const nonce = data.slice(1, 25);
        const ciphertext = data.slice(25);

        const plaintext = await this.keyServiceFactory
            .createVaultKeyService(secureEncryptedStorage)
            .decrypt(ciphertext, nonce);
        return plaintext.toString('utf8');
    }
}
