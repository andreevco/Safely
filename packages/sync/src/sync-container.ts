import type { ZodType } from 'zod';

import { ApiSigner } from './api/api-signer';
import type { Configuration } from './api/generated';
import { AccountsApi, SnapshotsApi } from './api/generated';
import { SnapshotsSse } from './api/snapshots-sse';
import { StorageVerifierService } from './crdt/storage-verifier-service';
import { YCRDTRepository } from './crdt/y-crdt-repository';
import { YManager } from './crdt/y-manager';
import { EncryptedKeyRepository } from './crypto/encrypted-key-repository';
import { DmkVerifierService } from './crypto/service/dmk-verifier-service';
import { IkService } from './crypto/service/ik-service';
import { KeyServiceFactory } from './crypto/service/key-service-factory';
import { SyncKeyService } from './crypto/service/sync-key-service';
import { DeviceManagementService } from './device-manager/device-management-service';
import { DeviceRepository } from './device-manager/device-repository';
import type { IStorage } from './I-storage';
import type { Logger } from './logger';
import { SecretEncryptor } from './secret-encryptor';
import { SnapshotSender } from './sync-operations/snapshot-sender';
import { SyncOperations } from './sync-operations/sync-operations';
import { UpdateDecryptorService } from './update-encryptor/update-decryptor-service';
import { UpdateEncryptorService } from './update-encryptor/update-encryptor-service';
import { UpdateHandler } from './update-handler/handler';
import { SyncStateRepository } from './update-handler/sync-state-repository';

export type SyncContainer = {
    storage: IStorage;
    encryptedStorage: IStorage;
    logger: Logger;

    keyRepository: EncryptedKeyRepository;
    crdtRepository: YCRDTRepository;
    syncStateRepository: SyncStateRepository;
    deviceRepository: DeviceRepository;

    keyServiceFactory: KeyServiceFactory;
    dmkVerifierService: DmkVerifierService;
    ikService: IkService;
    syncKeyService: SyncKeyService;

    storageVerifierService: StorageVerifierService;

    updateEncryptor: UpdateEncryptorService;
    updateDecryptor: UpdateDecryptorService;
    updateHandler: UpdateHandler;
    snapshotSender: SnapshotSender;
    syncOperations: SyncOperations;

    yManager: YManager;
    deviceManager: DeviceManagementService;

    apiSigner: ApiSigner;
    accountsApi: AccountsApi;
    snapshotApi: SnapshotsApi;
    snapshotSse: SnapshotsSse;

    secretEncryptor: SecretEncryptor;
};

export async function createSyncContainer(opts: {
    accountId: string;
    structure: Record<string, ZodType>;
    storage: IStorage;
    encryptedStorage: IStorage;
    logger: Logger;
    apiConfiguration?: Configuration;
}): Promise<SyncContainer> {
    const keyRepository = new EncryptedKeyRepository(opts.encryptedStorage);
    const syncStateRepository = new SyncStateRepository(opts.storage, opts.logger);
    const crdtRepository = new YCRDTRepository(opts.storage, opts.structure);
    const deviceRepository = new DeviceRepository(opts.storage);

    const ikService = new IkService(keyRepository);
    const syncKeyService = new SyncKeyService(keyRepository);
    const dmkVerifierService = new DmkVerifierService(keyRepository);
    const keyServiceFactory = new KeyServiceFactory(opts.accountId);

    const apiSigner = new ApiSigner(ikService);
    const accountsApi = new AccountsApi(apiSigner, opts.apiConfiguration);
    const snapshotApi = new SnapshotsApi(apiSigner, opts.apiConfiguration);
    const snapshotSse = new SnapshotsSse(syncStateRepository, snapshotApi, apiSigner, opts.logger);

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
        snapshotApi,
        opts.logger
    );
    const snapshotSender = new SnapshotSender(
        updateEncryptor,
        yManager,
        syncStateRepository,
        snapshotApi,
        ikService
    );
    const syncOperations = new SyncOperations(updateHandler, snapshotSender, deviceManager);

    const secretEncryptor = new SecretEncryptor(keyServiceFactory);

    return {
        logger: opts.logger,
        dmkVerifierService,
        keyServiceFactory,
        storage: opts.storage,
        encryptedStorage: opts.encryptedStorage,
        storageVerifierService,
        keyRepository,
        syncStateRepository,
        crdtRepository,
        deviceRepository,
        ikService,
        syncKeyService,
        updateEncryptor,
        updateDecryptor,
        updateHandler,
        snapshotSender,
        syncOperations,
        yManager,
        deviceManager,
        apiSigner,
        accountsApi,
        snapshotApi,
        snapshotSse,
        secretEncryptor
    };
}
