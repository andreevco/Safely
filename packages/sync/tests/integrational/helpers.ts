import { z } from 'zod';

import { ISyncAccount, SyncAccountFactory } from '../../src';
import { InMemStorage } from '../impl/storage';

export const Schema = {
    wallets: z.array(z.string())
};

export function makeFactory() {
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

export async function onboardDevice(
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
