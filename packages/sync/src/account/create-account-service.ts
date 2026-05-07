import type { ZodType } from 'zod';

import { generateAccountID, generateMasterKey, initializeSyncAccount } from '../initialize';
import { getSyncAccountStorage } from './sync-account-storage';
import { createSyncContainer } from '../sync-container';
import { SyncAccount } from './sync-account';
import type { SyncAccountRepository } from './sync-account-repository';
import type { Configuration } from '../api/generated';
import type { ITreeStorage } from '../I-storage';
import type { Logger } from '../logger/logger';
import type { OnboardingMessagePayload } from '../onboarding/onboarding-message-payload';
import { AccountAlreadyExistsError } from '../sync-error';
import { OfflineSyncProvider } from '../sync-provider/offline-sync-provider';
import { OnlineSyncProvider } from '../sync-provider/online-sync-provider';
import { SyncStatus } from '../sync-provider/sync-status';

export class CreateAccountService<S extends Record<string, ZodType>> {
    constructor(
        private readonly storage: ITreeStorage,
        private readonly encryptedStorage: ITreeStorage,
        private readonly syncAccountIDRepository: SyncAccountRepository,
        private readonly structure: S,
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
            structure: this.structure,
            masterKey,
            logger
        });
        masterKey.fill(0);

        await this.syncAccountIDRepository.addAccount(accountID);

        const container = await createSyncContainer({
            accountId: accountID,
            structure: this.structure,
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
            structure: this.structure,
            syncProvider: new OfflineSyncProvider(this.structure, container),
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
            structure: this.structure,
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
            structure: this.structure,
            storage,
            encryptedStorage,
            apiConfiguration: this.apiConfiguration,
            logger
        });
        await container.accountsApi.confirmOnboarding();

        const account = new SyncAccount({
            accountId: accountID,
            structure: this.structure,
            syncProvider: await OnlineSyncProvider.create(this.structure, container),
            container,
            syncAccountRepository: this.syncAccountIDRepository,
            online: true
        });
        await account.syncProvider.syncStatusManager.waitForStatus(SyncStatus.SYNCHRONIZED);

        // TODO: in scenario when computation crushed before this point, the new device will not be
        // added to the Y.doc. We need to handle this edge case
        await container.yManager.addDeviceOp(payload.addOp);
        await container.deviceManager.verifyDeviceOpAndApply(payload.addOp);
        account.syncProvider.triggerSync();

        return account;
    }
}
