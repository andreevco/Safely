import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { defineVersionHList, hCons, hNil, projectIdentity } from '@safely/slottree';

import { InMemStorage } from './impl/storage';
import type { ISyncAccount } from '../src/account/I-sync-account';
import { SyncAccountFactory } from '../src/account/sync-account-factory';
import { Logger } from '../src/logger/logger';
import { NewDeviceOnboarding } from '../src/onboarding/new-device-onboarding';

const AccountV1 = {
    version: 1,
    schema: z.object({ value: z.string() }),
    initial: { value: '' },
    projectUp: projectIdentity,
    projectDown: projectIdentity
} as const;
const versions = defineVersionHList(hCons(AccountV1, hNil));

describe('SyncAccountFactory onboarding', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('starts new-device onboarding eagerly and reuses its completion promise', async () => {
        const connectedAccount = {} as ISyncAccount<(typeof versions)['head']>;
        const waitForOnboarding = vi
            .spyOn(NewDeviceOnboarding.prototype, 'waitForOnboarding')
            .mockResolvedValue(connectedAccount);
        const factory = new SyncAccountFactory({
            storage: new InMemStorage(),
            encryptedStorage: new InMemStorage(),
            versions,
            logger: new Logger({ log: () => undefined })
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
