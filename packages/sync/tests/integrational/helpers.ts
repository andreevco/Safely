import { z } from 'zod';

import {
    defineVersionHList,
    hCons,
    hNil,
    orderedIds,
    orderedSet,
    projectIdentity,
    toOrderedSet
} from '@safely/slottree';

import { ISyncAccount, SyncAccountFactory } from '../../src';
import { Logger } from '../../src/logger/logger';
import { InMemStorage } from '../impl/storage';

export const Schema = z
    .object({
        wallets: orderedSet(z.string())
    })
    .partial();

export const AccountV1 = {
    version: 1,
    schema: Schema,
    initial: {},
    projectUp: projectIdentity,
    projectDown: projectIdentity
} as const;

export const Versions = defineVersionHList(hCons(AccountV1, hNil));

type AccountLatest = (typeof Versions)['head'];
export type TestSyncAccount = ISyncAccount<AccountLatest>;
export type TestSyncAccountFactory = SyncAccountFactory<typeof Versions>;

export function walletsToOrderedSet(wallets: readonly string[]) {
    return toOrderedSet(wallets, wallet => wallet);
}

export function walletsFromOrderedSet(
    wallets: ReturnType<typeof walletsToOrderedSet> | undefined
): string[] {
    if (wallets === undefined) {
        return [];
    }

    return orderedIds(wallets).map(id => wallets.setById[id]);
}

let accountCounter = 0;

export function makeFactory(): TestSyncAccountFactory {
    const storage = new InMemStorage();
    const encryptedStorage = new InMemStorage();
    const apiConfiguration = {
        basePath: 'https://dev-sync.safely.app'
    };
    const factoryId = accountCounter++;

    return new SyncAccountFactory({
        storage,
        encryptedStorage,
        versions: Versions,
        apiConfiguration,
        noAccountLogger: new Logger().child(`${factoryId}`),
        getAccountLogger: accountId => new Logger().child(`${factoryId}:${accountId}`)
    });
}

export async function onboardDevice(
    existingAccount: TestSyncAccount,
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
