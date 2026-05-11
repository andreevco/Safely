import type { AssertVersionHList, HCons, StorageVersion } from '@safely/slottree';

import type { ISyncAccount } from './I-sync-account';
import { getSyncAccountStorage } from './sync-account-storage';
import { createSyncContainer } from '../sync-container';
import type { CreateAccountService } from './create-account-service';
import { SyncAccount } from './sync-account';
import type { SyncAccountRepository } from './sync-account-repository';
import type { Configuration } from '../api/generated';
import type { ITreeStorage } from '../I-storage';
import type { Logger } from '../logger';
import type { OnboardingMessagePayload } from '../onboarding/onboarding-message-payload';
import { OfflineSyncProvider } from '../sync-provider/offline-sync-provider';
import { OnlineSyncProvider } from '../sync-provider/online-sync-provider';

export class AccountManager<Latest extends StorageVersion, Rest> {
    private readonly accounts = new Map<string, ISyncAccount<Latest>>();

    constructor(
        private readonly storage: ITreeStorage,
        private readonly encryptedStorage: ITreeStorage,
        private readonly syncAccountIdRepository: SyncAccountRepository,
        private readonly versions: HCons<Latest, Rest> & AssertVersionHList<HCons<Latest, Rest>>,
        private readonly apiConfiguration: Configuration,
        private readonly createAccountService: CreateAccountService<Latest, Rest>,
        private readonly getAccountLogger: (accountId: string) => Logger
    ) {}

    public async getAccounts(): Promise<ISyncAccount<Latest>[]> {
        if (this.accounts.size === 0) {
            await this.initializeAccounts();
        }
        return [...this.accounts.values()];
    }

    private async initializeAccounts(): Promise<void> {
        const accountInfos = await this.syncAccountIdRepository.getSyncAccounts();
        for (const accountInfo of accountInfos) {
            const acc = await this.getSyncAccount(accountInfo.accountId);
            this.accounts.set(acc.accountId, acc);
        }
    }

    public async getSyncAccount(accountId: string): Promise<ISyncAccount<Latest>> {
        if (this.accounts.has(accountId)) {
            return this.accounts.get(accountId)!;
        }

        const accountInfo = await this.syncAccountIdRepository.getSyncAccount(accountId);

        const storage = getSyncAccountStorage(this.storage, accountInfo.accountId);
        const encryptedStorage = getSyncAccountStorage(
            this.encryptedStorage,
            accountInfo.accountId
        );
        const logger = this.getAccountLogger(accountInfo.accountId);
        const container = await createSyncContainer({
            accountId,
            versions: this.versions,
            storage,
            encryptedStorage,
            apiConfiguration: this.apiConfiguration,
            logger
        });

        const syncProvider = accountInfo.online
            ? await OnlineSyncProvider.create(container)
            : new OfflineSyncProvider(container);

        return new SyncAccount({
            accountId: accountInfo.accountId,
            structure: this.versions,
            syncProvider,
            container,
            syncAccountRepository: this.syncAccountIdRepository,
            online: accountInfo.online
        });
    }

    public async createOfflineAccount(
        secureEncryptedStorage: ITreeStorage
    ): Promise<ISyncAccount<Latest>> {
        const account =
            await this.createAccountService.createOfflineAccount(secureEncryptedStorage);
        this.accounts.set(account.accountId, account);
        return account;
    }

    public async createOnlineAccountFromMasterKey(
        secureEncryptedStorage: ITreeStorage,
        payload: OnboardingMessagePayload,
        ik: { publicKey: Buffer; secretKey: Buffer }
    ) {
        const account = await this.createAccountService.createOnlineAccountFromMasterKey(
            secureEncryptedStorage,
            payload,
            ik
        );
        this.accounts.set(account.accountId, account);
        return account;
    }

    public async deleteAccount(
        accountId: string,
        secureEncryptedStorage: ITreeStorage
    ): Promise<void> {
        const accountInfo = await this.syncAccountIdRepository.getSyncAccount(accountId);

        if (accountInfo.online) {
            const account = (await this.getSyncAccount(accountId)) as SyncAccount<Latest, Rest>;
            await account.deleteThisDevice(secureEncryptedStorage);
        }

        const storage = getSyncAccountStorage(this.storage, accountId);
        const encryptedStorage = getSyncAccountStorage(this.encryptedStorage, accountId);
        const secureKeychainStorage = getSyncAccountStorage(secureEncryptedStorage, accountId);
        await storage.clear();
        await encryptedStorage.clear();
        await secureKeychainStorage.clear();
        await this.syncAccountIdRepository.removeAccount(accountId);

        this.accounts.delete(accountId);
    }
}
