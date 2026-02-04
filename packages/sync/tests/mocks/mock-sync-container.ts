import { MockSnapshotsApi, MockSnapshotsServer, MockSnapshotsSse } from './mock-snapshots-api';
import { ApiSigner } from '../../src/api/api-signer';
import { AccountsApi, Configuration, SnapshotsApi } from '../../src/api/generated';
import { StorageVerifierService } from '../../src/crdt/storage-verifier-service';
import { YCRDTRepository } from '../../src/crdt/y-crdt-repository';
import { YManager } from '../../src/crdt/y-manager';
import { KeyRepository } from '../../src/crypto/key-repository';
import { DmkService } from '../../src/crypto/service/dmk-service';
import { IkService } from '../../src/crypto/service/ik-service';
import { MasterKeyService } from '../../src/crypto/service/master-key-service';
import { SyncKeyService } from '../../src/crypto/service/sync-key-service';
import { DeviceManagementService } from '../../src/device-manager/device-management-service';
import { DeviceRepository } from '../../src/device-manager/device-repository';
import { IStorage } from '../../src/I-storage';
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
    storage: IStorage,
    keychainStorage: IStorage,
    server: MockSnapshotsServer,
    apiConfiguration?: Configuration
): Promise<MockSyncContainer> {
    const keyRepository = new KeyRepository(keychainStorage);
    const syncStateRepository = new SyncStateRepository(storage);
    const crdtRepository = new YCRDTRepository(storage);
    const deviceRepository = new DeviceRepository(storage);

    const ikService = new IkService(keyRepository);
    const dmkService = new DmkService(keyRepository);
    const syncKeyService = new SyncKeyService(keyRepository);
    const masterKeyService = new MasterKeyService(keyRepository);

    const apiSigner = new ApiSigner(ikService);
    const accountsApi = new AccountsApi(apiSigner, apiConfiguration);
    const snapshotApi = new MockSnapshotsApi(server);
    const snapshotSse = new MockSnapshotsSse(server);

    const yManager = await YManager.create(crdtRepository);
    const deviceManager = new DeviceManagementService(deviceRepository, yManager, keyRepository);

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
        snapshotApi as unknown as SnapshotsApi
    );

    return {
        storageVerifierService,
        keyRepository,
        syncStateRepository,
        crdtRepository,
        deviceRepository,
        ikService,
        dmkService,
        syncKeyService,
        masterKeyService,
        updateEncryptor,
        updateDecryptor,
        updateHandler,
        yManager,
        deviceManager,
        apiSigner,
        accountsApi,
        snapshotApi,
        snapshotSse
    };
}
