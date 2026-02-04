import { ApiSigner } from './api/api-signer';
import { AccountsApi, Configuration, SnapshotsApi } from './api/generated';
import { SnapshotsSse } from './api/snapshots-sse';
import { StorageVerifierService } from './crdt/storage-verifier-service';
import { YCRDTRepository } from './crdt/y-crdt-repository';
import { YManager } from './crdt/y-manager';
import { KeyRepository } from './crypto/key-repository';
import { DmkService } from './crypto/service/dmk-service';
import { IkService } from './crypto/service/ik-service';
import { MasterKeyService } from './crypto/service/master-key-service';
import { SyncKeyService } from './crypto/service/sync-key-service';
import { DeviceManagementService } from './device-manager/device-management-service';
import { DeviceRepository } from './device-manager/device-repository';
import { IStorage } from './I-storage';
import { UpdateDecryptorService } from './update-encryptor/update-decryptor-service';
import { UpdateEncryptorService } from './update-encryptor/update-encryptor-service';
import { UpdateHandler } from './update-handler/handler';
import { SyncStateRepository } from './update-handler/sync-state-repository';

export type SyncContainer = {
    storage: IStorage;
    keychainStorage: IStorage;

    keyRepository: KeyRepository;
    crdtRepository: YCRDTRepository;
    syncStateRepository: SyncStateRepository;
    deviceRepository: DeviceRepository;

    ikService: IkService;
    dmkService: DmkService;
    syncKeyService: SyncKeyService;
    masterKeyService: MasterKeyService;

    storageVerifierService: StorageVerifierService;

    updateEncryptor: UpdateEncryptorService;
    updateDecryptor: UpdateDecryptorService;
    updateHandler: UpdateHandler;

    yManager: YManager;
    deviceManager: DeviceManagementService;

    apiSigner: ApiSigner;
    accountsApi: AccountsApi;
    snapshotApi: SnapshotsApi;
    snapshotSse: SnapshotsSse;
};

export async function createSyncContainer(opts: {
    storage: IStorage;
    keychainStorage: IStorage;
    apiConfiguration?: Configuration;
}): Promise<SyncContainer> {
    const keyRepository = new KeyRepository(opts.keychainStorage);
    const syncStateRepository = new SyncStateRepository(opts.storage);
    const crdtRepository = new YCRDTRepository(opts.storage);
    const deviceRepository = new DeviceRepository(opts.storage);

    const ikService = new IkService(keyRepository);
    const dmkService = new DmkService(keyRepository);
    const syncKeyService = new SyncKeyService(keyRepository);
    const masterKeyService = new MasterKeyService(keyRepository);

    const apiSigner = new ApiSigner(ikService);
    const accountsApi = new AccountsApi(apiSigner, opts.apiConfiguration);
    const snapshotApi = new SnapshotsApi(apiSigner, opts.apiConfiguration);
    const snapshotSse = new SnapshotsSse(syncStateRepository, snapshotApi, apiSigner);

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
        snapshotApi
    );

    return {
        storage: opts.storage,
        keychainStorage: opts.keychainStorage,
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
