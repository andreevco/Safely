import { waitForNextSynchronizationCycle, waitWithTimeout } from './synchronization';
import { SyncStatus } from '../../src/sync-provider/sync-status';
import type { TestSyncAccount } from '../fixtures/account';
import type { InMemStorage } from '../impl/storage';
import type { MockSyncAccountFactory } from '../impl/sync-server-factory';

export async function onboardMockAccount(
    existingAccount: TestSyncAccount,
    existingFactory: MockSyncAccountFactory,
    existingSecureEncryptedStorage: InMemStorage,
    newFactory: MockSyncAccountFactory,
    newSecureEncryptedStorage: InMemStorage
): Promise<TestSyncAccount> {
    existingFactory.setRequesterIk(existingAccount.getMyDeviceIkPub().toString('hex'));
    const connector =
        await newFactory.factory.connectToExistingSyncAccount(newSecureEncryptedStorage);
    newFactory.setRequesterIkFromOnboardingData(connector.data);

    const connectExistingAccount = waitForNextSynchronizationCycle(
        existingAccount,
        'new device addition synchronized',
        () => existingAccount.connectToNewDevice(connector.data, existingSecureEncryptedStorage)
    );
    const [, newAccount] = await waitWithTimeout(
        Promise.all([connectExistingAccount, connector.waitForCompletion()]),
        'mock device onboarding'
    );

    await waitWithTimeout(
        newAccount.syncProvider.syncStatusManager.waitForStatus(SyncStatus.SYNCHRONIZED),
        'new device synchronized'
    );

    return newAccount;
}
