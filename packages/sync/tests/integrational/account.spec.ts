import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { ISyncAccount } from '../../src';
import { SyncAccountFactory } from '../../src';
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
    const apiConfiguration = {
        basePath: 'https://dev-sync.safely.app'
    };
    return new SyncAccountFactory({
        storage,
        encryptedStorage,
        structure: Schema,
        apiConfiguration
    });
}

async function onboardDevice(
    existingAccount: ISyncAccount<typeof Schema>,
    existingAccountSecureEncryptedStorage: InMemStorage
) {
    const secureEncryptedStorage = new InMemStorage();

    const factoryDevice2 = makeFactory();
    const onboardingConnector =
        await factoryDevice2.connectToExistingSyncAccount(secureEncryptedStorage);
    const promise1 = existingAccount.connectToNewDevice(
        onboardingConnector.data,
        existingAccountSecureEncryptedStorage
    );
    const promise2 = onboardingConnector.waitForCompletion();
    const [_, newAccount] = await Promise.all([promise1, promise2]);
    return {
        newAccount,
        secureEncryptedStorage
    };
}

describe('Account', () => {
    let factory: SyncAccountFactory<typeof Schema>;
    let secureEncryptedStorage: InMemStorage;

    beforeEach(async () => {
        factory = makeFactory();
        secureEncryptedStorage = new InMemStorage();
    });

    it('create account', async () => {
        const account = await factory.createSyncAccount(secureEncryptedStorage);

        const devices = await account.getDevices();
        expect(devices).toHaveLength(1);
    });

    it('makes account online', async () => {
        const account = await factory.createSyncAccount(secureEncryptedStorage);
        await onboardDevice(account, secureEncryptedStorage);
        expect(account.syncProvider.type).toBe('online');
    });

    it('should sync data with server', async () => {
        const account = await factory.createSyncAccount(secureEncryptedStorage);
        await onboardDevice(account, secureEncryptedStorage);

        await account.syncProvider.set('wallets', [
            {
                name: 'My Wallet',
                mnemonic: 'test'
            }
        ]);

        await new Promise(resolve => setTimeout(resolve, 1000));
    });

    it('should onboard new device', async () => {
        const account = await factory.createSyncAccount(secureEncryptedStorage);
        const { newAccount } = await onboardDevice(account, secureEncryptedStorage);

        await account.syncProvider.set('wallets', [
            {
                name: 'My Wallet',
                mnemonic: 'test'
            }
        ]);

        await vi.waitFor(async () => {
            const wallets = await newAccount.syncProvider.get('wallets');
            expect(wallets).toEqual([
                {
                    name: 'My Wallet',
                    mnemonic: 'test'
                }
            ]);
        });
    });

    it('should delete offline account', async () => {
        const account = await factory.createSyncAccount(secureEncryptedStorage);
        await factory.deleteLocalAccount(account.accountId, secureEncryptedStorage);

        const accounts = await factory.getSyncAccounts();
        expect(accounts).toHaveLength(0);
    });

    // TODO: this test emits error
    it('should delete online account', async () => {
        const account = await factory.createSyncAccount(secureEncryptedStorage);
        await onboardDevice(account, secureEncryptedStorage);
        await new Promise(resolve => setTimeout(resolve, 200));

        await factory.deleteLocalAccount(account.accountId, secureEncryptedStorage);

        const accounts = await factory.getSyncAccounts();
        expect(accounts).toHaveLength(0);
    });
});
