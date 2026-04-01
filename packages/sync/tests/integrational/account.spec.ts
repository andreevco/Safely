import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { zArrayWithKey, ISyncAccount, SyncAccountFactory } from '../../src';
import { SyncStatus } from '../../src/sync-provider/sync-status';
import { InMemStorage } from '../impl/storage';

const SchemaTestWallet = z.object({
    name: z.string(),
    mnemonic: z.string()
});
const SchemaTestWallets = zArrayWithKey(SchemaTestWallet, item => item.name);
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
        await account.syncProvider.syncStatusManager.waitForStatus(SyncStatus.SYNCHRONIZED);
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
            const wallets = newAccount.syncProvider.get('wallets');
            expect(wallets).toEqual([
                {
                    name: 'My Wallet',
                    mnemonic: 'test'
                }
            ]);
        });

        await newAccount.syncProvider.set('wallets', [
            {
                name: 'My Wallet 2',
                mnemonic: 'test'
            }
        ]);

        await vi.waitFor(async () => {
            const wallets = account.syncProvider.get('wallets');
            expect(wallets).toEqual([
                {
                    name: 'My Wallet 2',
                    mnemonic: 'test'
                }
            ]);
        });
    });

    it('should reconnect and accept update after reconnect', async () => {
        const account = await factory.createSyncAccount(secureEncryptedStorage);
        const { newAccount } = await onboardDevice(account, secureEncryptedStorage);

        await account.syncProvider.set('wallets', [
            {
                name: 'My Wallet',
                mnemonic: 'test'
            }
        ]);

        await vi.waitFor(async () => {
            const wallets = newAccount.syncProvider.get('wallets');
            expect(wallets).toEqual([
                {
                    name: 'My Wallet',
                    mnemonic: 'test'
                }
            ]);
        });

        account.syncProvider.restart();
        await account.syncProvider.syncStatusManager.waitForStatus(SyncStatus.SYNCHRONIZED);

        await account.syncProvider.set('wallets', [
            {
                name: 'My Wallet 2',
                mnemonic: 'test'
            }
        ]);

        await vi.waitFor(async () => {
            const wallets = newAccount.syncProvider.get('wallets');
            expect(wallets).toEqual([
                {
                    name: 'My Wallet 2',
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
