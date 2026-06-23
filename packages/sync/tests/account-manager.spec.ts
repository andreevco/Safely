import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { createStorage, defineVersionHList, hCons, hNil, projectIdentity } from '@safely/slottree';

import { InMemStorage } from './impl/storage';
import { AccountManager } from '../src/account/account-manager';
import type { CreateAccountService } from '../src/account/create-account-service';
import { SyncAccountRepository } from '../src/account/sync-account-repository';
import { getSyncAccountStorage } from '../src/account/sync-account-storage';
import { Configuration } from '../src/api/generated';
import { generateAccountID, generateMasterKey, initializeSyncAccount } from '../src/initialize';
import { Logger } from '../src/logger/logger';

const AccountSchema = z.object({ value: z.string() });

const AccountV1 = {
    version: 1,
    schema: AccountSchema,
    initial: { value: '' },
    projectUp: projectIdentity,
    projectDown: projectIdentity
} as const;

const AccountV2 = {
    version: 2,
    schema: AccountSchema,
    initial: { value: '' },
    projectUp: projectIdentity,
    projectDown: projectIdentity
} as const;

const knownVersions = defineVersionHList(hCons(AccountV1, hNil));
const futureVersions = defineVersionHList(hCons(AccountV2, hCons(AccountV1, hNil)));

async function createInitializedAccountManager() {
    const storage = new InMemStorage();
    const encryptedStorage = new InMemStorage();
    const secureEncryptedStorage = new InMemStorage();
    const repository = new SyncAccountRepository(storage);
    const logger = new Logger({ log: () => {} });
    const masterKey = await generateMasterKey();
    const accountId = await generateAccountID(masterKey);
    const accountStorage = getSyncAccountStorage(storage, accountId);

    await initializeSyncAccount({
        storage: accountStorage,
        encryptedStorage: getSyncAccountStorage(encryptedStorage, accountId),
        secureEncryptedStorage: getSyncAccountStorage(secureEncryptedStorage, accountId),
        versions: knownVersions,
        masterKey,
        logger
    });
    await repository.addAccount(accountId);

    const manager = new AccountManager(
        storage,
        encryptedStorage,
        repository,
        knownVersions,
        new Configuration({ basePath: 'mock://sync' }),
        undefined,
        {} as CreateAccountService<(typeof knownVersions)['head'], (typeof knownVersions)['tail']>,
        2500,
        logger
    );

    return {
        accountId,
        accountStorage,
        manager
    };
}

describe('AccountManager', () => {
    it('returns the same account instance for concurrent getSyncAccount calls', async () => {
        const { accountId, manager } = await createInitializedAccountManager();

        const [first, second] = await Promise.all([
            manager.getSyncAccount(accountId),
            manager.getSyncAccount(accountId)
        ]);

        expect(first).toBe(second);
    });

    it('exposes newer storage versions on the sync provider without failing account load', async () => {
        const { accountId, accountStorage, manager } = await createInitializedAccountManager();

        const futureStorage = createStorage({
            authorId: Buffer.from('future-device'),
            versions: futureVersions
        });
        await accountStorage.setItem('crdt', futureStorage.export().toString('base64url'));

        const account = await manager.getSyncAccount(accountId);

        expect(account.syncProvider.hasNewerStorageVersions).toBe(true);
        expect(account.syncProvider.getAll()).toEqual({ value: '' });
    });
});
