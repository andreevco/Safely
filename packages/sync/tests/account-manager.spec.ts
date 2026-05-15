import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { AccountManager } from '../src/account/account-manager';
import type { CreateAccountService } from '../src/account/create-account-service';
import { getSyncAccountStorage } from '../src/account/sync-account-storage';
import { SyncAccountRepository } from '../src/account/sync-account-repository';
import { Configuration } from '../src/api/generated';
import { generateAccountID, generateMasterKey, initializeSyncAccount } from '../src/initialize';
import { Logger } from '../src/logger/logger';
import { InMemStorage } from './impl/storage';

describe('AccountManager', () => {
    it('returns the same account instance for concurrent getSyncAccount calls', async () => {
        const storage = new InMemStorage();
        const encryptedStorage = new InMemStorage();
        const secureEncryptedStorage = new InMemStorage();
        const repository = new SyncAccountRepository(storage);
        const structure = { value: z.string() };
        const logger = new Logger({ log: () => {} });
        const masterKey = await generateMasterKey();
        const accountId = await generateAccountID(masterKey);

        await initializeSyncAccount({
            storage: getSyncAccountStorage(storage, accountId),
            encryptedStorage: getSyncAccountStorage(encryptedStorage, accountId),
            secureEncryptedStorage: getSyncAccountStorage(secureEncryptedStorage, accountId),
            structure,
            masterKey,
            logger
        });
        await repository.addAccount(accountId);

        const manager = new AccountManager(
            storage,
            encryptedStorage,
            repository,
            structure,
            new Configuration({ basePath: 'mock://sync' }),
            {} as CreateAccountService<typeof structure>,
            () => logger
        );

        const [first, second] = await Promise.all([
            manager.getSyncAccount(accountId),
            manager.getSyncAccount(accountId)
        ]);

        expect(first).toBe(second);
    });
});
