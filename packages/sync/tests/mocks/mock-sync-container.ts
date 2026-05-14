import { z } from 'zod';

import { MockSnapshotsApi, MockSnapshotsServer, MockSnapshotsSse } from './mock-snapshots-api';
import { ApiSigner } from '../../src/api/api-signer';
import { AccountsApi, Configuration, SnapshotsApi } from '../../src/api/generated';
import { StorageVerifierService } from '../../src/crdt/storage-verifier-service';
import { YCRDTRepository } from '../../src/crdt/y-crdt-repository';
import { YManager } from '../../src/crdt/y-manager';
import { EncryptedKeyRepository } from '../../src/crypto/encrypted-key-repository';
import { DmkVerifierService } from '../../src/crypto/service/dmk-verifier-service';
import { IkService } from '../../src/crypto/service/ik-service';
import { KeyServiceFactory } from '../../src/crypto/service/key-service-factory';
import { SyncKeyService } from '../../src/crypto/service/sync-key-service';
import { DeviceManagementService } from '../../src/device-manager/device-management-service';
import { DeviceRepository } from '../../src/device-manager/device-repository';
import { ITreeStorage } from '../../src/I-storage';
import { Logger } from '../../src/logger/logger';
import { SecretEncryptor } from '../../src/secret-encryptor';
import { SyncContainer } from '../../src/sync-container';
import { UpdateDecryptorService } from '../../src/update-encryptor/update-decryptor-service';
import { UpdateEncryptorService } from '../../src/update-encryptor/update-encryptor-service';
import { UpdateHandler } from '../../src/update-handler/handler';
import { SyncStateRepository } from '../../src/update-handler/sync-state-repository';

export type MockSyncContainer = Omit<SyncContainer, 'snapshotApi' | 'snapshotSse'> & {
    snapshotApi: MockSnapshotsApi;
    snapshotSse: MockSnapshotsSse;
};

export async function createMockSyncContainer(
    storage: ITreeStorage,
    encryptedStorage: ITreeStorage,
    server: MockSnapshotsServer,
    accountId: string,
    logger: Logger,
    structure: Record<string, z.ZodType>,
    apiConfiguration?: Configuration
): Promise<MockSyncContainer> {
    const keyRepository = await EncryptedKeyRepository.initialize(encryptedStorage);
    const syncStateRepository = new SyncStateRepository(storage, logger);
    const crdtRepository = new YCRDTRepository(storage, structure);
    const deviceRepository = new DeviceRepository(storage);

    const ikService = new IkService(keyRepository);
    const syncKeyService = new SyncKeyService(keyRepository);
    const dmkVerifierService = new DmkVerifierService(keyRepository);
    const keyServiceFactory = new KeyServiceFactory(accountId);

    const apiSigner = new ApiSigner(ikService);
    const accountsApi = new AccountsApi(apiSigner, apiConfiguration);
    const snapshotApi = new MockSnapshotsApi(server);
    const snapshotSse = new MockSnapshotsSse(server);

    const yManager = await YManager.create(crdtRepository);
    const deviceManager = new DeviceManagementService(
        deviceRepository,
        yManager,
        ikService,
        dmkVerifierService
    );

    const updateEncryptor = new UpdateEncryptorService(
        syncKeyService,
        ikService,
        syncStateRepository
    );
    const updateDecryptor = new UpdateDecryptorService(syncKeyService, deviceManager);

    const storageVerifierService = new StorageVerifierService(deviceManager);
    const updateHandler = new UpdateHandler(
        syncStateRepository,
        yManager,
        updateDecryptor,
        storageVerifierService,
        deviceManager,
        snapshotApi as unknown as SnapshotsApi,
        logger
    );

    const secretEncryptor = new SecretEncryptor(keyServiceFactory);

    return {
        logger,
        storage,
        encryptedStorage,
        storageVerifierService,
        keyRepository,
        syncStateRepository,
        crdtRepository,
        deviceRepository,
        ikService,
        syncKeyService,
        keyServiceFactory,
        updateEncryptor,
        updateDecryptor,
        updateHandler,
        yManager,
        deviceManager,
        dmkVerifierService,
        apiSigner,
        accountsApi,
        snapshotApi,
        snapshotSse,
        secretEncryptor
    };
}
