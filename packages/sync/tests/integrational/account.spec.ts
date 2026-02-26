import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { ISyncAccount } from '../../src/account/I-sync-account';
import { SyncAccountFactory } from '../../src/account/sync-account-factory';
import { InMemStorage } from '../impl/storage';

const SchemaTestWallet = z.object({
    name: z.string(),
    mnemonic: z.string()
});
const SchemaTestWallets = z.array(SchemaTestWallet);
export const Schema = {
    wallets: SchemaTestWallets
};

function makeFactory() {
    const storage = new InMemStorage();
    const encryptedStorage = new InMemStorage();
    const secureEncryptedStorage = new InMemStorage();
    const apiConfiguration = {
        basePath: 'https://dev-sync.safely.app'
    };
    return new SyncAccountFactory({
        storage,
        encryptedStorage,
        secureEncryptedStorage,
        structure: Schema,
        apiConfiguration
    });
}

async function onboardDevice(
    existingAccount: ISyncAccount<typeof Schema>
): Promise<ISyncAccount<typeof Schema>> {
    const factoryDevice2 = makeFactory();
    const onboardingConnector = await factoryDevice2.connectToExistingSyncAccount();
    const promise1 = existingAccount.connectToNewDevice(onboardingConnector.data);
    const promise2 = onboardingConnector.waitForCompletion();
    const [_, newAccount] = await Promise.all([promise1, promise2]);
    return newAccount;
}

describe('Account', () => {
    let factory: SyncAccountFactory<typeof Schema>;

    beforeEach(async () => {
        factory = makeFactory();
    });

    it('create account', async () => {
        const account = await factory.createSyncAccount();

        const devices = await account.getDevices();
        expect(devices).toHaveLength(1);
    });

    it('makes account online', async () => {
        const account = await factory.createSyncAccount();
        await onboardDevice(account);
        expect(account.syncProvider.type).toBe('online');
    });

    it('should sync data with server', async () => {
        const account = await factory.createSyncAccount();
        await onboardDevice(account);

        await account.syncProvider.set('wallets', [
            {
                name: 'My Wallet',
                mnemonic: 'test'
            }
        ]);

        await new Promise(resolve => setTimeout(resolve, 1000));
    });

    it('should onboard new device', async () => {
        const account = await factory.createSyncAccount();
        const onlineAccount2 = await onboardDevice(account);

        await account.syncProvider.set('wallets', [
            {
                name: 'My Wallet',
                mnemonic: 'test'
            }
        ]);

        await vi.waitFor(async () => {
            const wallets = await onlineAccount2.syncProvider.get('wallets');
            expect(wallets).toEqual([
                {
                    name: 'My Wallet',
                    mnemonic: 'test'
                }
            ]);
        });
    });

    it('should delete offline account', async () => {
        const account = await factory.createSyncAccount();
        await factory.deleteLocalAccount(account.accountId);

        const accounts = await factory.getSyncAccounts();
        expect(accounts).toHaveLength(0);
    });

    // TODO: this test emits error
    it('should delete online account', async () => {
        const account = await factory.createSyncAccount();
        await onboardDevice(account);
        await new Promise(resolve => setTimeout(resolve, 200));

        await factory.deleteLocalAccount(account.accountId);

        const accounts = await factory.getSyncAccounts();
        expect(accounts).toHaveLength(0);
    });
});
