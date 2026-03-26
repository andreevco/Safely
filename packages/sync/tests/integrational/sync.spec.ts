import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeFactory, onboardDevice, Schema } from './helpers';
import { ISyncAccount, SyncAccountFactory } from '../../src';
import { InMemStorage } from '../impl/storage';

describe('Account', () => {
    let factory: SyncAccountFactory<typeof Schema>;
    let secureEncryptedStorage: InMemStorage;
    let accounts: ISyncAccount<typeof Schema>[];

    beforeEach(async () => {
        factory = makeFactory();
        secureEncryptedStorage = new InMemStorage();
        accounts = [];
    });

    async function setAndVerify(account: ISyncAccount<typeof Schema>, data: string[]) {
        await account.syncProvider.set('wallets', data);
        await vi.waitFor(async () => {
            // checks if all accounts synchronized
            for (const acc of accounts) {
                const wallets = acc.syncProvider.get('wallets');
                expect(wallets).toEqual(data);
            }
        });
    }

    it('should sync 2 devices', async () => {
        const account = await factory.createSyncAccount(secureEncryptedStorage);
        const { newAccount } = await onboardDevice(account, secureEncryptedStorage);

        accounts.push(account);
        accounts.push(newAccount);

        await setAndVerify(account, ['wallet1']);
        await setAndVerify(newAccount, ['wallet1', 'wallet2']);
        await setAndVerify(account, ['wallet2', 'wallet3']);
        await setAndVerify(newAccount, ['wallet4']);

        account.syncProvider.restart();
        newAccount.syncProvider.restart();

        await setAndVerify(account, ['wallet5']);
        await setAndVerify(account, ['wallet6']);
        await setAndVerify(newAccount, ['wallet7']);
        await setAndVerify(account, ['wallet8']);
    });

    it('should sync 3 devices', async () => {
        const account = await factory.createSyncAccount(secureEncryptedStorage);
        const { newAccount: account2 } = await onboardDevice(account, secureEncryptedStorage);
        const { newAccount: account3 } = await onboardDevice(account, secureEncryptedStorage);

        accounts.push(account);
        accounts.push(account2);
        accounts.push(account3);

        await setAndVerify(account, ['wallet1']);
        await setAndVerify(account2, ['wallet1', 'wallet2']);
        await setAndVerify(account3, ['wallet1', 'wallet2', 'wallet3']);
    });
});
