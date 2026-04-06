import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeFactory, onboardDevice, Schema } from './helpers';
import { ISyncAccount, SyncAccountFactory } from '../../src';
import { InMemStorage } from '../impl/storage';

describe('Sync', () => {
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

    it('should sync device list when 1 device is onboarded', async () => {
        const account = await factory.createSyncAccount(secureEncryptedStorage);
        const { newAccount: account2 } = await onboardDevice(account, secureEncryptedStorage);

        accounts.push(account);
        accounts.push(account2);

        await vi.waitFor(async () => {
            const devices1 = await account.getDevices();
            const devices2 = await account2.getDevices();

            expect(devices1).toHaveLength(2);
            expect(devices1).toEqual(devices2);
        });
    });

    it('should sync device lists between 3 devices (A->B, A->C)', async () => {
        const account = await factory.createSyncAccount(secureEncryptedStorage);
        const { newAccount: account2 } = await onboardDevice(account, secureEncryptedStorage);
        const { newAccount: account3 } = await onboardDevice(account, secureEncryptedStorage);

        accounts.push(account);
        accounts.push(account2);
        accounts.push(account3);

        await vi.waitFor(async () => {
            const devices1 = await account.getDevices();
            const devices2 = await account2.getDevices();
            const devices3 = await account3.getDevices();

            expect(devices1).toEqual(devices2);
            expect(devices2).toEqual(devices3);
        });
    });

    it('should sync device lists between 3 devices (A->B, B->C)', async () => {
        const account = await factory.createSyncAccount(secureEncryptedStorage);
        const { newAccount: account2, secureEncryptedStorage: secureEncryptedStorage2 } =
            await onboardDevice(account, secureEncryptedStorage);
        const { newAccount: account3 } = await onboardDevice(account2, secureEncryptedStorage2);

        accounts.push(account);
        accounts.push(account2);
        accounts.push(account3);

        await vi.waitFor(async () => {
            const devices1 = await account.getDevices();
            const devices2 = await account2.getDevices();
            const devices3 = await account3.getDevices();

            expect(devices1).toEqual(devices2);
            expect(devices2).toEqual(devices3);
        });
    });
});
