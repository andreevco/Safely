import { z } from 'zod';

import type { IStorage } from '../I-storage';

export class SyncAccountRepository {
    constructor(private readonly storage: IStorage) {}

    public async getSyncAccounts(): Promise<AccountInfo[]> {
        const accounts = await this.storage.getItem('sync_accounts');
        if (!accounts) {
            return [];
        }
        return AccountInfoSchema.array().parse(JSON.parse(accounts));
    }

    public async getSyncAccount(accountId: AccountID): Promise<AccountInfo> {
        const accounts = await this.getSyncAccounts();
        const account = accounts.find(x => x.accountId === accountId);
        if (!account) {
            throw new Error(`Account with ID "${accountId}" does not exist.`);
        }
        return account;
    }

    public async addAccount(accountId: AccountID, online = false): Promise<void> {
        const accounts = await this.getSyncAccounts();
        if (accounts.some(x => x.accountId === accountId)) {
            throw new Error(`Account with ID "${accountId}" already exists.`);
        }
        accounts.push({
            accountId,
            online
        });
        await this.storage.setItem(
            'sync_accounts',
            JSON.stringify(accounts.map(x => AccountInfoSchema.parse(x)))
        );
    }

    public async setAccountOnlineStatus(id: AccountID, online: boolean): Promise<void> {
        const accounts = await this.getSyncAccounts();
        const account = accounts.find(x => x.accountId === id);
        if (!account) {
            throw new Error(`Account with ID "${id}" does not exist.`);
        }
        account.online = online;
        await this.storage.setItem('sync_accounts', JSON.stringify(accounts));
    }

    public async removeAccount(id: AccountID): Promise<void> {
        const accounts = await this.getSyncAccounts();
        const index = accounts.findIndex(x => x.accountId === id);
        if (index === -1) {
            throw new Error(`Account with ID "${id}" does not exist.`);
        }
        accounts.splice(index, 1);
        await this.storage.setItem('sync_accounts', JSON.stringify(accounts));
    }
}

export type AccountID = string;

export type AccountInfo = {
    accountId: AccountID;
    online: boolean;
};

export const AccountInfoSchema = z.object({
    accountId: z.string(),
    online: z.boolean()
});
