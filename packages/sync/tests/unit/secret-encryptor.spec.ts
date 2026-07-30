import { randomBytes } from '@noble/ciphers/utils.js';
import { beforeEach, describe, expect, it } from 'vitest';

import type { ITreeStorage } from '../../src';
import { EncryptedKeyRepository } from '../../src/crypto/encrypted-key-repository';
import { SecureEncryptedKeyRepository } from '../../src/crypto/secure-encrypted-key-repository';
import { KeyServiceFactory } from '../../src/crypto/service/key-service-factory';
import { generateAccountID, initializeKeys } from '../../src/initialize';
import { SecretEncryptor } from '../../src/secret-encryptor';
import { InMemStorage } from '../mocks/server-mock/storage';

describe('sync machine', () => {
    let secretEncryptor: SecretEncryptor;
    let secureEncryptedStorage: ITreeStorage;

    beforeEach(async () => {
        const masterKey = Buffer.from(randomBytes(32));
        const accountId = await generateAccountID(masterKey);

        const encryptedStorage = new InMemStorage();
        secureEncryptedStorage = new InMemStorage();
        const keyRepository = new EncryptedKeyRepository(encryptedStorage.child(accountId));
        const secureEncryptedKeyRepository = new SecureEncryptedKeyRepository(
            secureEncryptedStorage.child(accountId)
        );
        await initializeKeys(keyRepository, secureEncryptedKeyRepository, masterKey);
        secretEncryptor = new SecretEncryptor(new KeyServiceFactory(accountId));
    });

    it('should encrypt and decrypt the same message', async () => {
        const encryptedPayload = await secretEncryptor.encrypt(
            'hello world',
            secureEncryptedStorage
        );
        expect(encryptedPayload).not.toEqual('hello world');
        const plaintext = await secretEncryptor.decrypt(encryptedPayload, secureEncryptedStorage);
        expect(plaintext).toBe('hello world');
    });

    it('should fail on wrong version', async () => {
        const encryptedPayload = await secretEncryptor.encrypt(
            'hello world',
            secureEncryptedStorage
        );
        const data = Buffer.from(encryptedPayload, 'hex');
        data[0] = 0x02; // change version to unsupported one
        const tamperedPayload = data.toString('hex');
        await expect(
            secretEncryptor.decrypt(tamperedPayload, secureEncryptedStorage)
        ).rejects.toThrow('Unsupported version: 2');
    });
});
