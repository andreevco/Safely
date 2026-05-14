import type { AssertVersionHList, HCons, StorageVersion } from '@safely/slottree';

import type { MockSnapshotsServer } from './mock-snapshots-api';
import { MockSnapshotsApi, MockSnapshotsSse } from './mock-snapshots-api';
import { ApiSigner } from '../../src/api/api-signer';
import type { Configuration, SnapshotsApi } from '../../src/api/generated';
import { AccountsApi } from '../../src/api/generated';
import { YCRDTRepository } from '../../src/crdt/y-crdt-repository';
import { YManager } from '../../src/crdt/y-manager';
import { EncryptedKeyRepository } from '../../src/crypto/encrypted-key-repository';
import { DmkVerifierService } from '../../src/crypto/service/dmk-verifier-service';
import { IkService } from '../../src/crypto/service/ik-service';
import { KeyServiceFactory } from '../../src/crypto/service/key-service-factory';
import { SyncKeyService } from '../../src/crypto/service/sync-key-service';
import { DeviceManagementService } from '../../src/device-manager/device-management-service';
import { DeviceRepository } from '../../src/device-manager/device-repository';
import type { tDevicesLatest, tDevicesRest } from '../../src/device-manager/device-storage-schema';
import { DevicesVersions } from '../../src/device-manager/device-storage-schema';
import type { ITreeStorage } from '../../src/I-storage';
import type { Logger } from '../../src/logger/logger';
import { SecretEncryptor } from '../../src/secret-encryptor';
import type { SyncContainer } from '../../src/sync-container';
import { UpdateDecryptorService } from '../../src/update-encryptor/update-decryptor-service';
import { UpdateEncryptorService } from '../../src/update-encryptor/update-encryptor-service';
import { UpdateHandler } from '../../src/update-handler/handler';
import { SyncStateRepository } from '../../src/update-handler/sync-state-repository';

export type MockSyncContainer<Latest extends StorageVersion, Rest> = Omit<
    SyncContainer<Latest, Rest>,
    'snapshotApi' | 'snapshotSse'
> & {
    snapshotApi: MockSnapshotsApi;
    snapshotSse: MockSnapshotsSse;
};

export async function createMockSyncContainer<Latest extends StorageVersion, Rest>(
    storage: ITreeStorage,
    encryptedStorage: ITreeStorage,
    server: MockSnapshotsServer,
    accountId: string,
    logger: Logger,
    versions: HCons<Latest, Rest> & AssertVersionHList<HCons<Latest, Rest>>,
    apiConfiguration?: Configuration
): Promise<MockSyncContainer<Latest, Rest>> {
    const keyRepository = await EncryptedKeyRepository.initialize(encryptedStorage);
    const syncStateRepository = new SyncStateRepository(storage, logger);

    const ikService = new IkService(keyRepository);
    const syncKeyService = new SyncKeyService(keyRepository);
    const dmkVerifierService = new DmkVerifierService(keyRepository);
    const keyServiceFactory = new KeyServiceFactory(accountId);

    const apiSigner = new ApiSigner(ikService);
    const accountsApi = new AccountsApi(apiSigner, apiConfiguration);
    const snapshotApi = new MockSnapshotsApi(server);
    const snapshotSse = new MockSnapshotsSse(server);

    const crdtRepository = new YCRDTRepository(storage, await ikService.getPub(), versions);
    const yManager = await YManager.create(crdtRepository);
    const deviceCrdtRepository = new YCRDTRepository<tDevicesLatest, tDevicesRest>(
        storage,
        await ikService.getPub(),
        DevicesVersions,
        'devices_crdt'
    );
    const deviceYManager = await YManager.create<tDevicesLatest, tDevicesRest>(
        deviceCrdtRepository
    );
    const deviceRepository = new DeviceRepository(deviceYManager);
    const deviceManager = new DeviceManagementService(
        deviceRepository,
        ikService,
        dmkVerifierService
    );

    const updateEncryptor = new UpdateEncryptorService(
        syncKeyService,
        ikService,
        syncStateRepository
    );
    const updateDecryptor = new UpdateDecryptorService(syncKeyService, deviceManager);

    const updateHandler = new UpdateHandler<Latest, Rest>(
        syncStateRepository,
        yManager,
        deviceYManager,
        updateDecryptor,
        deviceManager,
        snapshotApi as unknown as SnapshotsApi,
        logger
    );

    const secretEncryptor = new SecretEncryptor(keyServiceFactory);

    return {
        versions,
        logger,
        storage,
        encryptedStorage,
        keyRepository,
        syncStateRepository,
        crdtRepository,
        deviceCrdtRepository,
        deviceRepository,
        ikService,
        syncKeyService,
        keyServiceFactory,
        updateEncryptor,
        updateDecryptor,
        updateHandler,
        yManager,
        deviceYManager,
        deviceManager,
        dmkVerifierService,
        apiSigner,
        accountsApi,
        snapshotApi,
        snapshotSse,
        secretEncryptor
    };
}
