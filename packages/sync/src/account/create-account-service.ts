import { AssertVersionHList, HCons, StorageVersion } from '@safely/slottree';

import { generateAccountID, generateMasterKey, initializeSyncAccount } from '../initialize';
import { getSyncAccountStorage } from './sync-account-storage';
import { createSyncContainer } from '../sync-container';
import { SyncAccount } from './sync-account';
import { SyncAccountRepository } from './sync-account-repository';
import { Configuration } from '../api/generated';
import { ITreeStorage } from '../I-storage';
import { Logger } from '../logger/logger';
import { OnboardingMessagePayload } from '../onboarding/onboarding-message-payload';
import { AccountAlreadyExistsError } from '../sync-error';
import { OfflineSyncProvider } from '../sync-provider/offline-sync-provider';
import { OnlineSyncProvider } from '../sync-provider/online-sync-provider';
import { SyncStatus } from '../sync-provider/sync-status';

export class CreateAccountService<Latest extends StorageVersion, Rest> {
    constructor(
        private readonly storage: ITreeStorage,
        private readonly encryptedStorage: ITreeStorage,
        private readonly syncAccountIDRepository: SyncAccountRepository,
        private readonly versions: HCons<Latest, Rest> & AssertVersionHList<HCons<Latest, Rest>>,
        private readonly apiConfiguration: Configuration,
        private readonly getAccountLogger: (accountId: string) => Logger
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
        const logger = this.getAccountLogger(accountID);
        await initializeSyncAccount({
            storage,
            encryptedStorage,
            secureEncryptedStorage: accountSecureEncryptedStorage,
            versions: this.versions,
            masterKey,
            logger
        });
        masterKey.fill(0);

        await this.syncAccountIDRepository.addAccount(accountID);

        const container = await createSyncContainer({
            accountId: accountID,
            versions: this.versions,
            storage,
            encryptedStorage,
            apiConfiguration: this.apiConfiguration,
            logger
        });

        await container.deviceManager.addDevice(
            await container.ikService.getPub(),
            container.keyServiceFactory.createDmkSignerService(secureEncryptedStorage)
        );

        return new SyncAccount({
            accountId: accountID,
            structure: this.versions,
            syncProvider: new OfflineSyncProvider(container),
            container,
            syncAccountRepository: this.syncAccountIDRepository,
            online: false
        });
    }

    public async createOnlineAccountFromMasterKey(
        secureEncryptedStorage: ITreeStorage,
        payload: OnboardingMessagePayload,
        ik: { publicKey: Buffer; secretKey: Buffer }
    ) {
        const accountID = await generateAccountID(payload.masterKey);

        const accounts = await this.syncAccountIDRepository.getSyncAccounts();
        if (accounts.some(acc => acc.accountId === accountID)) {
            throw new AccountAlreadyExistsError();
        }

        const storage = getSyncAccountStorage(this.storage, accountID);
        const encryptedStorage = getSyncAccountStorage(this.encryptedStorage, accountID);
        const accountSecureEncryptedStorage = getSyncAccountStorage(
            secureEncryptedStorage,
            accountID
        );
        const logger = this.getAccountLogger(accountID);
        await initializeSyncAccount({
            storage,
            versions: this.versions,
            encryptedStorage: encryptedStorage,
            secureEncryptedStorage: accountSecureEncryptedStorage,
            masterKey: payload.masterKey,
            ik,
            logger
        });
        payload.masterKey.fill(0);

        await this.syncAccountIDRepository.addAccount(accountID, true);

        const container = await createSyncContainer({
            accountId: accountID,
            versions: this.versions,
            storage,
            encryptedStorage,
            apiConfiguration: this.apiConfiguration,
            logger
        });
        await container.accountsApi.confirmOnboarding();

        const account = new SyncAccount({
            accountId: accountID,
            structure: this.versions,
            syncProvider: await OnlineSyncProvider.create(
                container,
                undefined,
                container.keyServiceFactory.createDmkSignerService(secureEncryptedStorage)
            ),
            container,
            syncAccountRepository: this.syncAccountIDRepository,
            online: true
        });
        await account.syncProvider.syncStatusManager.waitForStatus(SyncStatus.SYNCHRONIZED);

        return account;
    }
}
