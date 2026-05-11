import type { AssertVersionHList, HCons, StorageVersion } from '@safely/slottree';

import { ApiSigner } from './api/api-signer';
import type { Configuration } from './api/generated';
import { AccountsApi, SnapshotsApi } from './api/generated';
import { SnapshotsSse } from './api/snapshots-sse';
import { YCRDTRepository } from './crdt/y-crdt-repository';
import { YManager } from './crdt/y-manager';
import { EncryptedKeyRepository } from './crypto/encrypted-key-repository';
import { DmkVerifierService } from './crypto/service/dmk-verifier-service';
import { IkService } from './crypto/service/ik-service';
import { KeyServiceFactory } from './crypto/service/key-service-factory';
import { SyncKeyService } from './crypto/service/sync-key-service';
import { DeviceManagementService } from './device-manager/device-management-service';
import { DeviceRepository } from './device-manager/device-repository';
import {
    DevicesVersions,
    tDevicesLatest,
    tDevicesRest
} from './device-manager/device-storage-schema';
import type { IStorage } from './I-storage';
import type { Logger } from './logger';
import { SecretEncryptor } from './secret-encryptor';
import { UpdateDecryptorService } from './update-encryptor/update-decryptor-service';
import { UpdateEncryptorService } from './update-encryptor/update-encryptor-service';
import { UpdateHandler } from './update-handler/handler';
import { SyncStateRepository } from './update-handler/sync-state-repository';

export type SyncContainer<Latest extends StorageVersion, Rest> = {
    versions: HCons<Latest, Rest> & AssertVersionHList<HCons<Latest, Rest>>;
    storage: IStorage;
    encryptedStorage: IStorage;
    logger: Logger;

    keyRepository: EncryptedKeyRepository;
    crdtRepository: YCRDTRepository<Latest, Rest>;
    deviceCrdtRepository: YCRDTRepository<tDevicesLatest, tDevicesRest>;
    syncStateRepository: SyncStateRepository;
    deviceRepository: DeviceRepository;

    keyServiceFactory: KeyServiceFactory;
    dmkVerifierService: DmkVerifierService;
    ikService: IkService;
    syncKeyService: SyncKeyService;

    updateEncryptor: UpdateEncryptorService;
    updateDecryptor: UpdateDecryptorService;
    updateHandler: UpdateHandler<Latest, Rest>;

    yManager: YManager<Latest, Rest>;
    deviceYManager: YManager<tDevicesLatest, tDevicesRest>;
    deviceManager: DeviceManagementService;

    apiSigner: ApiSigner;
    accountsApi: AccountsApi;
    snapshotApi: SnapshotsApi;
    snapshotSse: SnapshotsSse;

    secretEncryptor: SecretEncryptor;
};

export async function createSyncContainer<Latest extends StorageVersion, Rest>(opts: {
    accountId: string;
    versions: HCons<Latest, Rest> & AssertVersionHList<HCons<Latest, Rest>>;
    storage: IStorage;
    encryptedStorage: IStorage;
    logger: Logger;
    apiConfiguration?: Configuration;
}): Promise<SyncContainer<Latest, Rest>> {
    const keyRepository = new EncryptedKeyRepository(opts.encryptedStorage);
    const syncStateRepository = new SyncStateRepository(opts.storage, opts.logger);

    const ikService = new IkService(keyRepository);
    const syncKeyService = new SyncKeyService(keyRepository);
    const dmkVerifierService = new DmkVerifierService(keyRepository);
    const keyServiceFactory = new KeyServiceFactory(opts.accountId);

    const apiSigner = new ApiSigner(ikService);
    const accountsApi = new AccountsApi(apiSigner, opts.apiConfiguration);
    const snapshotApi = new SnapshotsApi(apiSigner, opts.apiConfiguration);
    const snapshotSse = new SnapshotsSse(syncStateRepository, snapshotApi, apiSigner, opts.logger);

    const crdtRepository = new YCRDTRepository(
        opts.storage,
        await ikService.getPub(),
        opts.versions
    );
    const yManager = await YManager.create(crdtRepository);
    const deviceCrdtRepository = new YCRDTRepository<tDevicesLatest, tDevicesRest>(
        opts.storage,
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
        snapshotApi,
        opts.logger
    );

    const secretEncryptor = new SecretEncryptor(keyServiceFactory);

    return {
        versions: opts.versions,
        logger: opts.logger,
        dmkVerifierService,
        keyServiceFactory,
        storage: opts.storage,
        encryptedStorage: opts.encryptedStorage,
        keyRepository,
        syncStateRepository,
        crdtRepository,
        deviceCrdtRepository,
        deviceRepository,
        ikService,
        syncKeyService,
        updateEncryptor,
        updateDecryptor,
        updateHandler,
        yManager,
        deviceYManager,
        deviceManager,
        apiSigner,
        accountsApi,
        snapshotApi,
        snapshotSse,
        secretEncryptor
    };
}
