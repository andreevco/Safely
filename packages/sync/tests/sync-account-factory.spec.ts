import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { InMemStorage } from './impl/storage';
import type { ISyncAccount } from '../src/account/I-sync-account';
import { SyncAccountFactory } from '../src/account/sync-account-factory';
import { Logger } from '../src/logger/logger';
import { NewDeviceOnboarding } from '../src/onboarding/new-device-onboarding';

const structure = { value: z.string() };

describe('SyncAccountFactory onboarding', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('starts new-device onboarding eagerly and reuses its completion promise', async () => {
        const connectedAccount = {} as ISyncAccount<typeof structure>;
        const waitForOnboarding = vi
            .spyOn(NewDeviceOnboarding.prototype, 'waitForOnboarding')
            .mockResolvedValue(connectedAccount);
        const factory = new SyncAccountFactory({
            storage: new InMemStorage(),
            encryptedStorage: new InMemStorage(),
            structure,
            noAccountLogger: new Logger({ log: () => undefined }),
            getAccountLogger: () => new Logger({ log: () => undefined })
        });

        const [connector, secondConnector] = await Promise.all([
            factory.connectToExistingSyncAccount(new InMemStorage()),
            factory.connectToExistingSyncAccount(new InMemStorage())
        ]);

        expect(secondConnector).toBe(connector);
        expect(waitForOnboarding).toHaveBeenCalledTimes(1);

        const [firstResult, secondResult] = await Promise.all([
            connector.waitForCompletion(),
            connector.waitForCompletion()
        ]);

        expect(firstResult).toBe(connectedAccount);
        expect(secondResult).toBe(connectedAccount);
        expect(waitForOnboarding).toHaveBeenCalledTimes(1);
    });
});
