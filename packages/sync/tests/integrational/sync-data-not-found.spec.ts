import { beforeEach, describe, expect, it } from 'vitest';

import { SyncAccountFactory } from '../../src';
import { Logger } from '../../src/logger/logger';
import { QRMessageCodec, QRMessageOperation } from '../../src/onboarding/onboarding-codec';
import { SyncStatus } from '../../src/sync-provider/sync-status';
import type { TestSyncAccount } from '../e2e/helpers';
import { Versions } from '../e2e/helpers';
import { InMemStorage } from '../impl/storage';
import { SyncServer } from '../impl/sync-server';
import { createSyncServerApiImplementations } from '../impl/sync-server-api-implementations';

type SyncServerFactory = {
    factory: SyncAccountFactory<typeof Versions>;
    secureEncryptedStorage: InMemStorage;
    setRequesterIk: (ikPub: Buffer) => void;
    setRequesterIkFromOnboardingData: (data: Buffer) => void;
};

describe('sync data not found', () => {
    let server: SyncServer;

    beforeEach(() => {
        server = new SyncServer();
    });

    it('sets sync data not found status when server sync data is dropped', async () => {
        const primary = makeSyncServerFactory();
        const account = await primary.factory.createSyncAccount(primary.secureEncryptedStorage);

        await onboardDevice(account, primary, makeSyncServerFactory());

        server.dropSyncData(account.accountId);
        primary.setRequesterIk(account.getMyDeviceIkPub());
        account.syncProvider.restart();

        await account.syncProvider.syncStatusManager.waitForStatus(SyncStatus.SYNC_DATA_NOT_FOUND);
        expect(account.syncProvider.syncStatusManager.getStatus()).toBe(
            SyncStatus.SYNC_DATA_NOT_FOUND
        );
    });

    function makeSyncServerFactory(): SyncServerFactory {
        const storage = new InMemStorage();
        const encryptedStorage = new InMemStorage();
        const secureEncryptedStorage = new InMemStorage();
        let requesterIk: string | undefined;
        const apiImplementations = createSyncServerApiImplementations(server, () => {
            if (!requesterIk) {
                throw new Error('Requester IK is not set');
            }

            return requesterIk;
        });

        return {
            factory: new SyncAccountFactory({
                storage,
                encryptedStorage,
                versions: Versions,
                apiConfiguration: {
                    basePath: 'sync-server://mock'
                },
                apiImplementations,
                pollingTimeout: 1,
                logger: new Logger({ log: () => undefined })
            }),
            secureEncryptedStorage,
            setRequesterIk: ikPub => {
                requesterIk = ikPub.toString('hex');
            },
            setRequesterIkFromOnboardingData: data => {
                const onboardingMessage = QRMessageCodec.decode(data);
                if (onboardingMessage.type !== QRMessageOperation.NEW_DEVICE_ONBOARDING) {
                    throw new Error('Unexpected onboarding message type');
                }

                requesterIk = onboardingMessage.ikPub.toString('hex');
            }
        };
    }
});

async function onboardDevice(
    existingAccount: TestSyncAccount,
    existingDevice: SyncServerFactory,
    newDevice: SyncServerFactory
): Promise<TestSyncAccount> {
    const connector = await newDevice.factory.connectToExistingSyncAccount(
        newDevice.secureEncryptedStorage
    );

    existingDevice.setRequesterIk(existingAccount.getMyDeviceIkPub());
    newDevice.setRequesterIkFromOnboardingData(connector.data);

    const primaryOnboarding = existingAccount.connectToNewDevice(
        connector.data,
        existingDevice.secureEncryptedStorage
    );
    const [newAccount] = await Promise.all([connector.waitForCompletion(), primaryOnboarding]);

    await existingAccount.syncProvider.syncStatusManager.waitForStatus(SyncStatus.SYNCHRONIZED);
    await newAccount.syncProvider.syncStatusManager.waitForStatus(SyncStatus.SYNCHRONIZED);

    return newAccount;
}
