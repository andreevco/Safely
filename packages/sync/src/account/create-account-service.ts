import { ZodType } from 'zod';

import { generateAccountID, generateMasterKey, initializeSyncAccount } from '../initialize';
import { getSyncAccountStorage } from './sync-account-storage';
import { createSyncContainer } from '../sync-container';
import { SyncAccount } from './sync-account';
import { SyncAccountRepository } from './sync-account-repository';
import { Configuration } from '../api/generated';
import { ITreeStorage } from '../I-storage';
import { OfflineSyncProvider } from '../sync-provider/offline-sync-provider';
import { OnlineSyncProvider } from '../sync-provider/online-sync-provider';

export class CreateAccountService<S extends Record<string, ZodType>> {
    constructor(
        private readonly storage: ITreeStorage,
        private readonly keychainStorage: ITreeStorage,
        private readonly syncAccountIDRepository: SyncAccountRepository,
        private readonly structure: S,
        private readonly apiConfiguration: Configuration
    ) {}

    public async createOfflineAccount() {
        const masterKey = await generateMasterKey();
        const accountID = await generateAccountID(masterKey);

        const storage = getSyncAccountStorage(this.storage, accountID);
        const keychainStorage = getSyncAccountStorage(this.keychainStorage, accountID);
        await initializeSyncAccount(storage, keychainStorage, masterKey);
        masterKey.fill(0);

        await this.syncAccountIDRepository.addAccount(accountID);

        const container = await createSyncContainer({
            storage,
            keychainStorage,
            apiConfiguration: this.apiConfiguration
        });

        await container.deviceManager.addDevice({
            ikPub: await container.ikService.getPub()
        });

        return new SyncAccount(
            accountID,
            new OfflineSyncProvider(this.structure, container),
            container
        );
    }

    public async createOnlineAccountFromMasterKey(
        masterKey: Buffer,
        ik: { publicKey: Buffer; secretKey: Buffer }
    ) {
        const accountID = await generateAccountID(masterKey);

        const storage = getSyncAccountStorage(this.storage, accountID);
        const keychainStorage = getSyncAccountStorage(this.keychainStorage, accountID);
        await initializeSyncAccount(storage, keychainStorage, masterKey, ik);
        masterKey.fill(0);

        await this.syncAccountIDRepository.addAccount(accountID, true);

        const container = await createSyncContainer({
            storage,
            keychainStorage,
            apiConfiguration: this.apiConfiguration
        });

        return new SyncAccount(
            accountID,
            await OnlineSyncProvider.create(this.structure, container),
            container
        );
    }
}
