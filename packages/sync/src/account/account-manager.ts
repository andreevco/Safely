import { ZodType } from 'zod';

import { ISyncAccount } from './I-sync-account';
import { getSyncAccountStorage } from './sync-account-storage';
import { createSyncContainer } from '../sync-container';
import { CreateAccountService } from './create-account-service';
import { SyncAccount } from './sync-account';
import { SyncAccountRepository } from './sync-account-repository';
import { Configuration } from '../api/generated';
import { ITreeStorage } from '../I-storage';
import { OfflineSyncProvider } from '../sync-provider/offline-sync-provider';
import { OnlineSyncProvider } from '../sync-provider/online-sync-provider';

export class AccountManager<S extends Record<string, ZodType>> {
    private accounts: ISyncAccount<S>[] = [];

    constructor(
        private readonly storage: ITreeStorage,
        private readonly keychainStorage: ITreeStorage,
        private readonly syncAccountIdRepository: SyncAccountRepository,
        private readonly structure: S,
        private readonly apiConfiguration: Configuration,
        private readonly createAccountService: CreateAccountService<S>
    ) {}

    public async getAccounts(): Promise<ISyncAccount<S>[]> {
        if (this.accounts.length === 0) {
            await this.initializeAccounts();
        }
        return this.accounts;
    }

    private async initializeAccounts(): Promise<void> {
        const accountInfos = await this.syncAccountIdRepository.getSyncAccounts();
        const accounts: ISyncAccount<S>[] = [];
        for (const accountInfo of accountInfos) {
            accounts.push(await this.getSyncAccount(accountInfo.accountId));
        }
        this.accounts = accounts;
    }

    public async getSyncAccount(accountId: string): Promise<ISyncAccount<S>> {
        const accountInfo = await this.syncAccountIdRepository.getSyncAccount(accountId);

        const storage = getSyncAccountStorage(this.storage, accountInfo.accountId);
        const keychainStorage = getSyncAccountStorage(this.keychainStorage, accountInfo.accountId);
        const container = await createSyncContainer({
            storage,
            keychainStorage,
            apiConfiguration: this.apiConfiguration
        });

        if (accountInfo.online) {
            return new SyncAccount(
                accountInfo.accountId,
                await OnlineSyncProvider.create(this.structure, container),
                container
            );
        } else {
            return new SyncAccount(
                accountInfo.accountId,
                new OfflineSyncProvider(this.structure, container),
                container
            );
        }
    }

    public async createOfflineAccount(): Promise<ISyncAccount<S>> {
        const account = await this.createAccountService.createOfflineAccount();
        this.accounts.push(account);
        return account;
    }

    public async createOnlineAccountFromMasterKey(
        masterKey: Buffer,
        ik: { publicKey: Buffer; secretKey: Buffer }
    ) {
        const account = await this.createAccountService.createOnlineAccountFromMasterKey(
            masterKey,
            ik
        );
        this.accounts.push(account);
        return account;
    }

    public async deleteAccount(accountId: string): Promise<void> {
        const accountInfo = await this.syncAccountIdRepository.getSyncAccount(accountId);

        if (accountInfo.online) {
            const account = (await this.getSyncAccount(accountId)) as SyncAccount<S>;
            await account.deleteThisDevice();
        }

        const storage = getSyncAccountStorage(this.storage, accountId);
        const keychainStorage = getSyncAccountStorage(this.keychainStorage, accountId);
        await storage.clear();
        await keychainStorage.clear();
        await this.syncAccountIdRepository.removeAccount(accountId);

        this.accounts = this.accounts.filter(acc => acc.accountId !== accountId);
    }
}
