import { createActor } from 'xstate';
import { z } from 'zod';

import { defineVersionHList, hCons, hNil, projectIdentity } from '@safely/slottree';

import type { MockSnapshotsServer } from './mock-snapshots-api';
import type { MockSyncContainer } from './mock-sync-container';
import { createMockSyncContainer } from './mock-sync-container';
import { SyncStatus } from '../../src';
import type { SnapshotsApi } from '../../src/api/generated';
import type { SnapshotsSse } from '../../src/api/snapshots-sse';
import { generateAccountID, initializeSyncAccount } from '../../src/initialize';
import { Logger } from '../../src/logger/logger';
import type { SyncMachine } from '../../src/sync-machine/machine';
import { createSyncMachine } from '../../src/sync-machine/machine';
import { SyncStatusManager } from '../../src/sync-provider/sync-status';
import { encodeUpdatePayload } from '../../src/update-handler/update-payload';
import { InMemStorage } from '../impl/storage';

const TestSchema = z
    .object({
        value: z.string()
    })
    .partial();
const TestV1 = {
    version: 1,
    schema: TestSchema,
    initial: {},
    projectUp: projectIdentity,
    projectDown: projectIdentity
} as const;
const TestVersions = defineVersionHList(hCons(TestV1, hNil));
type TestLatest = (typeof TestVersions)['head'];
type TestRest = (typeof TestVersions)['tail'];
export type TestMockSyncContainer = MockSyncContainer<TestLatest, TestRest>;

export type MachineContext = {
    container: TestMockSyncContainer;
    machine: SyncMachine;
    secureEncryptedStorage: InMemStorage;
};

export async function createMachineContext(
    server: MockSnapshotsServer,
    masterKeyOpt?: Buffer,
    ikOpt?: { secretKey: Buffer; publicKey: Buffer },
    expectedSubscriberIncrease = 1
): Promise<MachineContext> {
    const masterKey = masterKeyOpt ?? Buffer.alloc(32, 0);
    const storage = new InMemStorage();
    const encryptedStorage = new InMemStorage();
    const secureEncryptedStorage = new InMemStorage();
    const accountId = await generateAccountID(masterKey);
    const accountStorage = storage.child(accountId);
    const accountEncryptedStorage = encryptedStorage.child(accountId);
    const accountSecureEncryptedStorage = secureEncryptedStorage.child(accountId);
    const logger = new Logger();
    await initializeSyncAccount({
        storage: accountStorage,
        versions: TestVersions,
        encryptedStorage: accountEncryptedStorage,
        secureEncryptedStorage: accountSecureEncryptedStorage,
        masterKey,
        logger,
        ik: ikOpt
    });
    const container = await createMockSyncContainer(
        accountStorage,
        accountEncryptedStorage,
        server,
        accountId,
        logger,
        TestVersions
    );

    if (!server.hasSnapshot()) {
        const encrypted = await container.updateEncryptor.encryptAndSign(
            encodeUpdatePayload({
                userStorage: container.yManager.encodeAsSnapshot(),
                deviceStorage: container.deviceYManager.encodeAsSnapshot()
            })
        );
        await server.seedFromSnapshot(encrypted);
    }

    const syncStatusManager = new SyncStatusManager(SyncStatus.DISCONNECTED);
    const machine = createActor(createSyncMachine(), {
        input: {
            syncStateRepository: container.syncStateRepository,
            deviceYManager: container.deviceYManager,
            snapshotsApi: container.snapshotApi as unknown as SnapshotsApi,
            snapshotsSse: container.snapshotSse as unknown as SnapshotsSse,
            syncOperations: container.syncOperations,
            syncStatusManager,
            logger: logger
        }
    });

    const baseSubscribers = server.subscriberCount;
    machine.start();

    await waitFor(() => server.subscriberCount === baseSubscribers + expectedSubscriberIncrease);
    await waitForSnapshotSync(container, server);

    return { container, machine, secureEncryptedStorage };
}

export async function waitFor(
    predicate: () => boolean | Promise<boolean>,
    timeoutMs = 2000
): Promise<void> {
    const started = Date.now();
    // small delay to give async work a chance to settle on the happy path
    do {
        if (await predicate()) {
            return;
        }
        await delay(10);
    } while (Date.now() - started < timeoutMs);

    throw new Error('Timed out waiting for condition');
}

function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function waitForSnapshotSync(
    container: TestMockSyncContainer,
    server: MockSnapshotsServer
): Promise<void> {
    await waitFor(async () => {
        const syncState = await container.syncStateRepository.getState();
        return syncState.snapshotProof.equals(server.getLatestSnapshotProof());
    });
}

export async function sendLocalUpdate(
    ctx: MachineContext,
    server: MockSnapshotsServer,
    key: 'value',
    value: string
): Promise<void> {
    const initialSnapshots = server.snapshotCount;
    await ctx.container.yManager.transaction(draft => {
        draft.set(key, value);
    });
    ctx.machine.send({ type: 'LOCAL_UPDATE' });

    await waitFor(() => server.snapshotCount === initialSnapshots + 1);
    await waitForSnapshotSync(ctx.container, server);
}

export function getMasterKey(seed: number): Buffer {
    return Buffer.alloc(32, seed);
}
