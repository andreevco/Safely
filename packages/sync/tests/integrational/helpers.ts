import { z } from 'zod';

import { zArrayWithKey, ISyncAccount, SyncAccountFactory } from '../../src';
import { defineStorageVersion, defineVersionChain } from '../../src/crdt/version';
import { Logger } from '../../src/logger/logger';
import { InMemStorage } from '../impl/storage';

export const Schema = {
    wallets: zArrayWithKey(z.string(), v => v)
} as const;

export const Version1 = defineStorageVersion<{}, typeof Schema>({
    version: 1,
    schema: Schema,
    migrate: () => {
        return {
            wallets: []
        };
    },
    reverseMigrate: () => {
        return {};
    }
});

export const Structure = defineVersionChain(Version1);

let accountCounter = 0;

export function makeFactory() {
    const storage = new InMemStorage();
    const encryptedStorage = new InMemStorage();
    const apiConfiguration = {
        basePath: 'https://dev-sync.safely.app'
    };
    return new SyncAccountFactory({
        storage,
        encryptedStorage,
        structure: Structure,
        apiConfiguration,
        logger: new Logger().child(`${accountCounter++}`)
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
