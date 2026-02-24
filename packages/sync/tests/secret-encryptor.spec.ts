import { beforeEach, describe, expect, it } from 'vitest';
import { createActor } from 'xstate';

import { InMemStorage } from './impl/storage';
import { MockSnapshotsServer } from './mocks/mock-snapshots-api';
import { createMockSyncContainer, MockSyncContainer } from './mocks/mock-sync-container';
import { SnapshotsApi } from '../src/api/generated';
import { SnapshotsSse } from '../src/api/snapshots-sse';
import { initializeKeys, initializeSyncAccount } from '../src/initialize';
import { createSyncMachine, SyncMachine } from '../src/sync-machine/machine';
import { SecretEncryptor } from '../src/secret-encryptor';
import { KeyRepository } from '../src/crypto/key-repository';
import { VaultKeyService } from '../src/crypto/service/vault-key-service';
import { randomBytes } from '@noble/ciphers/utils.js';

const DATA_KEY = 'value';

describe('sync machine', () => {
    let secretEncryptor: SecretEncryptor;

    beforeEach(() => {
        const encryptedStorage = new InMemStorage();
        const secureEncryptedStorage = new InMemStorage();
        const keyRepository = new KeyRepository(encryptedStorage, secureEncryptedStorage);
        initializeKeys(keyRepository, Buffer.from(randomBytes(24)));
        const vaultKeyService = new VaultKeyService(keyRepository);
        secretEncryptor = new SecretEncryptor(vaultKeyService);
    });

    it('should encrypt and decrypt the same message', async () => {
        const { encryptedPayload } = await secretEncryptor.encrypt('hello world');
        expect(encryptedPayload).not.toEqual('hello world');
        const { plaintext } = await secretEncryptor.decrypt(encryptedPayload);
        expect(plaintext).toBe('hello world');
    });

    it('should fail on wrong version', async () => {
        const { encryptedPayload } = await secretEncryptor.encrypt('hello world');
        const data = Buffer.from(encryptedPayload, 'hex');
        data[0] = 0x02; // change version to unsupported one
        const tamperedPayload = data.toString('hex');
        await expect(secretEncryptor.decrypt(tamperedPayload)).rejects.toThrow(
            'Unsupported version: 2'
        );
    });
});
