import { z } from 'zod';

import type { ISyncAccount } from '../../src';
import { zArrayWithKey, SyncAccountFactory } from '../../src';
import { Logger } from '../../src/logger/logger';
import { InMemStorage } from '../impl/storage';

export const Schema = {
    wallets: zArrayWithKey(z.string(), v => v)
};

let accountCounter = 0;

export function makeFactory() {
    const storage = new InMemStorage();
    const encryptedStorage = new InMemStorage();
    const apiConfiguration = {
        basePath: 'https://dev-sync.safely.app'
    };
    const factoryId = accountCounter++;

    return new SyncAccountFactory({
        storage,
        encryptedStorage,
        structure: Schema,
        apiConfiguration,
        pollingTimeout: 500,
        noAccountLogger: new Logger().child(`${factoryId}`),
        getAccountLogger: accountId => new Logger().child(`${factoryId}:${accountId}`)
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
