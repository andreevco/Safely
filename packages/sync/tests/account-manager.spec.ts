import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { defineVersionHList, hCons, hNil, projectIdentity } from '@safely/slottree';

import { InMemStorage } from './impl/storage';
import { AccountManager } from '../src/account/account-manager';
import type { CreateAccountService } from '../src/account/create-account-service';
import { SyncAccountRepository } from '../src/account/sync-account-repository';
import { getSyncAccountStorage } from '../src/account/sync-account-storage';
import { Configuration } from '../src/api/generated';
import { generateAccountID, generateMasterKey, initializeSyncAccount } from '../src/initialize';
import { Logger } from '../src/logger/logger';

describe('AccountManager', () => {
    it('returns the same account instance for concurrent getSyncAccount calls', async () => {
        const storage = new InMemStorage();
        const encryptedStorage = new InMemStorage();
        const secureEncryptedStorage = new InMemStorage();
        const repository = new SyncAccountRepository(storage);
        const AccountV1 = {
            version: 1,
            schema: z.object({ value: z.string() }),
            initial: { value: '' },
            projectUp: projectIdentity,
            projectDown: projectIdentity
        } as const;
        const versions = defineVersionHList(hCons(AccountV1, hNil));
        const logger = new Logger({ log: () => {} });
        const masterKey = await generateMasterKey();
        const accountId = await generateAccountID(masterKey);

        await initializeSyncAccount({
            storage: getSyncAccountStorage(storage, accountId),
            encryptedStorage: getSyncAccountStorage(encryptedStorage, accountId),
            secureEncryptedStorage: getSyncAccountStorage(secureEncryptedStorage, accountId),
            versions,
            masterKey,
            logger
        });
        await repository.addAccount(accountId);

        const manager = new AccountManager(
            storage,
            encryptedStorage,
            repository,
            versions,
            new Configuration({ basePath: 'mock://sync' }),
            undefined,
            {} as CreateAccountService<(typeof versions)['head'], (typeof versions)['tail']>,
            2500,
            logger
        );

        const [first, second] = await Promise.all([
            manager.getSyncAccount(accountId),
            manager.getSyncAccount(accountId)
        ]);

        expect(first).toBe(second);
    });
});
