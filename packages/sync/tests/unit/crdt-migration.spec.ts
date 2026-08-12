import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { defineVersionHList, hCons, hNil, patch, projectIdentity } from '@safely/slottree';

import { CrdtManager } from '../../src/crdt/crdt-manager';
import { CrdtRepository } from '../../src/crdt/crdt-repository';
import { InMemStorage } from '../mocks/server-mock/storage';

const walletSchema = z.object({
    __setId: z.string(),
    name: z.string()
});

const schemaV1 = z.object({
    wallets: z.array(walletSchema),
    latestDerivedIndex: z.number().int().nullable()
});

const schemaV2 = z.object({
    wallets: z.array(walletSchema),
    nextDerivingIndex: z.object({ index: z.number().int() }).nullable()
});

const v1 = {
    version: 1,
    schema: schemaV1,
    initial: {
        wallets: [] as z.output<typeof walletSchema>[],
        latestDerivedIndex: null
    },
    projectUp: projectIdentity,
    projectDown: projectIdentity
} as const;

const v2 = {
    version: 2,
    schema: schemaV2,
    initial: {
        wallets: [] as z.output<typeof walletSchema>[],
        nextDerivingIndex: null
    },
    projectUp: patch(schemaV1, schemaV2, draft =>
        draft
            .rename('latestDerivedIndex', 'nextDerivingIndex')
            .update(['nextDerivingIndex'], index => (index == null ? null : { index: index + 1 }))
    ),
    projectDown: patch(schemaV2, schemaV1, draft =>
        draft
            .rename('nextDerivingIndex', 'latestDerivedIndex')
            .update(['latestDerivedIndex'], info => (info == null ? null : info.index - 1))
    )
} as const;

const v1OnlyVersions = defineVersionHList(hCons(v1, hNil));
const v1v2Versions = defineVersionHList(hCons(v2, hCons(v1, hNil)));

const DEVICE_A = Buffer.from('device-a');
const DEVICE_B = Buffer.from('device-b');

const T_OLD_BUILD = new Date('2026-06-01T12:00:00Z');
const T_RESTART = new Date('2026-06-10T12:00:00Z');

// Old (v1-latest) build of the app persists user data into the shared storage
async function persistLegacyV1Data(
    storage: InMemStorage,
    opts: { secondV1Device?: boolean } = {}
): Promise<void> {
    const repository = new CrdtRepository(storage, DEVICE_A, v1OnlyVersions);
    const manager = await CrdtManager.create(repository);

    await manager.transaction(draft => {
        draft.at('wallets').push({ __setId: 'w1', name: 'Main' });
        draft.set('latestDerivedIndex', 3);
    });

    if (opts.secondV1Device) {
        await manager.addAuthor(DEVICE_B, 1);
    }
}

// New (v2-latest) build of the app starts over the same persisted storage
async function restartWithV2(storage: InMemStorage) {
    const repository = new CrdtRepository(storage, DEVICE_A, v1v2Versions);
    return await CrdtManager.create(repository);
}

describe('v1 -> v2 migration of locally persisted Crdt', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('migrates v1 data to v2 when the account has a single device', async () => {
        vi.useFakeTimers({ now: T_OLD_BUILD });
        const storage = new InMemStorage();
        await persistLegacyV1Data(storage);

        vi.setSystemTime(T_RESTART);
        const manager = await restartWithV2(storage);

        expect(manager.getFull().wallets).toHaveLength(1);
        expect(manager.getFull().nextDerivingIndex).toEqual({ index: 4 });
    });

    it('migrates v1 data to v2 when another v1 device exists', async () => {
        vi.useFakeTimers({ now: T_OLD_BUILD });
        const storage = new InMemStorage();
        await persistLegacyV1Data(storage, { secondV1Device: true });

        vi.setSystemTime(T_RESTART);
        const manager = await restartWithV2(storage);

        expect(manager.getFull().wallets).toHaveLength(1);
        expect(manager.getFull().nextDerivingIndex).toEqual({ index: 4 });
    });
});
