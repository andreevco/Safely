import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeFactory, onboardDevice, Schema } from './helpers';
import { SyncAccountFactory } from '../../src';
import { SyncStatus } from '../../src/sync-provider/sync-status';
import { InMemStorage } from '../impl/storage';

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
    });

    it('should sync data with server', async () => {
        const account = await factory.createSyncAccount(secureEncryptedStorage);
        await onboardDevice(account, secureEncryptedStorage);

        await account.syncProvider.set('wallets', ['wallet']);

        await new Promise(resolve => setTimeout(resolve, 1000));
    });

    it('should onboard new device', async () => {
        const account = await factory.createSyncAccount(secureEncryptedStorage);
        const { newAccount } = await onboardDevice(account, secureEncryptedStorage);

        await account.syncProvider.set('wallets', ['wallet']);

        await vi.waitFor(async () => {
            const wallets = newAccount.syncProvider.get('wallets');
            expect(wallets).toEqual(['wallet']);
        });

        await newAccount.syncProvider.set('wallets', ['wallet2']);

        await vi.waitFor(async () => {
            const wallets = account.syncProvider.get('wallets');
            expect(wallets).toEqual(['wallet2']);
        });
    });

    it('should reconnect and accept update after reconnect', async () => {
        const account = await factory.createSyncAccount(secureEncryptedStorage);
        const { newAccount } = await onboardDevice(account, secureEncryptedStorage);

        await account.syncProvider.set('wallets', ['wallet']);

        await vi.waitFor(async () => {
            const wallets = newAccount.syncProvider.get('wallets');
            expect(wallets).toEqual(['wallet']);
        });

        account.syncProvider.restart();
        await account.syncProvider.syncStatusManager.waitForStatus(SyncStatus.SYNCHRONIZED);

        await account.syncProvider.set('wallets', ['wallet2']);

        await vi.waitFor(async () => {
            const wallets = newAccount.syncProvider.get('wallets');
            expect(wallets).toEqual(['wallet2']);
        });
    });

    it('should delete offline account', async () => {
        const account = await factory.createSyncAccount(secureEncryptedStorage);
        await factory.deleteLocalAccount(account.accountId, secureEncryptedStorage);

        const accounts = await factory.getSyncAccounts();
        expect(accounts).toHaveLength(0);
    });

    it('should reconnect device after being revoked', async () => {
        const account = await factory.createSyncAccount(secureEncryptedStorage);
        const { newAccount } = await onboardDevice(account, secureEncryptedStorage);

        await account.revokeRemoteDevice(
            await newAccount.getMyDeviceIkPub(),
            secureEncryptedStorage
        );

        await newAccount.syncProvider.syncStatusManager.waitForStatus(SyncStatus.DEVICE_DELETED);
        expect(await account.getDevices()).toEqual([
            {
                ikPub: await account.getMyDeviceIkPub(),
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                addedAt: expect.any(Number)
            }
        ]);

        const connector = await newAccount.reconnectToAccount();
        const promise = account.connectToNewDevice(connector.data, secureEncryptedStorage);
        await Promise.all([connector.waitForCompletion(), promise]);

        await newAccount.syncProvider.syncStatusManager.waitForStatus(SyncStatus.SYNCHRONIZED);
        expect(await account.getDevices()).toEqual([
            {
                ikPub: await account.getMyDeviceIkPub(),
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                addedAt: expect.any(Number)
            },
            {
                ikPub: await newAccount.getMyDeviceIkPub(),
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                addedAt: expect.any(Number)
            }
        ]);
    }, 7000);

    // TODO: this test emits error
    it('should delete online account', async () => {
        const account = await factory.createSyncAccount(secureEncryptedStorage);
        await onboardDevice(account, secureEncryptedStorage);
        await new Promise(resolve => setTimeout(resolve, 200));

        await factory.deleteLocalAccount(account.accountId, secureEncryptedStorage);

        const accounts = await factory.getSyncAccounts();
        expect(accounts).toHaveLength(0);
    });

    describe('errors', () => {
        it('should handle when remote account is revoked after SSE is broken', async () => {
            const account = await factory.createSyncAccount(secureEncryptedStorage);
            const { newAccount } = await onboardDevice(account, secureEncryptedStorage);
            await new Promise(resolve => setTimeout(resolve, 200));

            await account.revokeRemoteDevice(
                await newAccount.getMyDeviceIkPub(),
                secureEncryptedStorage
            );

            await newAccount.syncProvider.syncStatusManager.waitForStatus(
                SyncStatus.DEVICE_DELETED
            );
        });

        it('should throw when onboarding existing account on new device', async () => {
            const account = await factory.createSyncAccount(secureEncryptedStorage);
            const { newAccount, secureEncryptedStorage: newAccountSES } = await onboardDevice(
                account,
                secureEncryptedStorage
            );

            const connector = await factory.connectToExistingSyncAccount(secureEncryptedStorage);
            const promise = newAccount.connectToNewDevice(connector.data, newAccountSES);

            await expect(
                Promise.all([connector.waitForCompletion(), promise])
            ).rejects.toThrowError('Account already exists');
        });
    });
});
