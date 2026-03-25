import { ZodType } from 'zod';

import { generateAccountID, generateMasterKey, initializeSyncAccount } from '../initialize';
import { getSyncAccountStorage } from './sync-account-storage';
import { createSyncContainer } from '../sync-container';
import { SyncAccount } from './sync-account';
import { SyncAccountRepository } from './sync-account-repository';
import { Configuration } from '../api/generated';
import { ITreeStorage } from '../I-storage';
import { Logger } from '../logger/logger';
import { OfflineSyncProvider } from '../sync-provider/offline-sync-provider';
import { OnlineSyncProvider } from '../sync-provider/online-sync-provider';

export class CreateAccountService<S extends Record<string, ZodType>> {
    constructor(
        private readonly storage: ITreeStorage,
        private readonly encryptedStorage: ITreeStorage,
        private readonly syncAccountIDRepository: SyncAccountRepository,
        private readonly structure: S,
        private readonly apiConfiguration: Configuration,
        private readonly logger: Logger
    ) {}

    public async createOfflineAccount(secureEncryptedStorage: ITreeStorage) {
        const masterKey = await generateMasterKey();
        const accountID = await generateAccountID(masterKey);

        const storage = getSyncAccountStorage(this.storage, accountID);
        const encryptedStorage = getSyncAccountStorage(this.encryptedStorage, accountID);
        const accountSecureEncryptedStorage = getSyncAccountStorage(
            secureEncryptedStorage,
            accountID
        );
        const logger = this.logger.child(accountID.slice(0, 4));
        await initializeSyncAccount({
            storage,
            encryptedStorage,
            secureEncryptedStorage: accountSecureEncryptedStorage,
            masterKey,
            logger
        });
        masterKey.fill(0);

        await this.syncAccountIDRepository.addAccount(accountID);

        const container = await createSyncContainer({
            accountId: accountID,
            storage,
            encryptedStorage,
            apiConfiguration: this.apiConfiguration,
            logger: this.logger.child(accountID.slice(0, 4))
        });

        await container.deviceManager.addDevice(
            {
                ikPub: await container.ikService.getPub()
            },
            container.keyServiceFactory.createDmkSignerService(secureEncryptedStorage)
        );

        return new SyncAccount({
            accountId: accountID,
            structure: this.structure,
            syncProvider: new OfflineSyncProvider(this.structure, container),
            container,
            syncAccountRepository: this.syncAccountIDRepository,
            online: false
        });
    }

    public async createOnlineAccountFromMasterKey(
        secureEncryptedStorage: ITreeStorage,
        masterKey: Buffer,
        ik: { publicKey: Buffer; secretKey: Buffer }
    ) {
        const accountID = await generateAccountID(masterKey);

        const storage = getSyncAccountStorage(this.storage, accountID);
        const encryptedStorage = getSyncAccountStorage(this.encryptedStorage, accountID);
        const accountSecureEncryptedStorage = getSyncAccountStorage(
            secureEncryptedStorage,
            accountID
        );
        const logger = this.logger.child(accountID.slice(0, 4));
        await initializeSyncAccount({
            storage,
            encryptedStorage: encryptedStorage,
            secureEncryptedStorage: accountSecureEncryptedStorage,
            masterKey,
            ik,
            logger
        });
        masterKey.fill(0);

        await this.syncAccountIDRepository.addAccount(accountID, true);

        const container = await createSyncContainer({
            accountId: accountID,
            storage,
            encryptedStorage,
            apiConfiguration: this.apiConfiguration,
            logger: this.logger.child(accountID.slice(0, 4))
        });
        await container.accountsApi.confirmOnboarding();

        return new SyncAccount({
            accountId: accountID,
            structure: this.structure,
            syncProvider: await OnlineSyncProvider.create(this.structure, container),
            container,
            syncAccountRepository: this.syncAccountIDRepository,
            online: true
        });
    }
}
