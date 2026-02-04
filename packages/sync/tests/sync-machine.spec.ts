import { beforeEach, describe, expect, it } from 'vitest';
import { createActor } from 'xstate';

import { InMemStorage } from './impl/storage';
import { MockSnapshotsServer } from './mocks/mock-snapshots-api';
import { createMockSyncContainer, MockSyncContainer } from './mocks/mock-sync-container';
import { SnapshotsApi } from '../src/api/generated';
import { SnapshotsSse } from '../src/api/snapshots-sse';
import { initializeSyncAccount } from '../src/initialize';
import { createSyncMachine, SyncMachine } from '../src/sync-machine/machine';

const DATA_KEY = 'value';

describe('sync machine', () => {
    let server: MockSnapshotsServer;

    beforeEach(() => {
        server = new MockSnapshotsServer();
    });

    it('sending update', async () => {
        const ctx = await createMachineContext(server, getMasterKey(1));

        try {
            const initialSnapshots = server.snapshotCount;

            await ctx.container.yManager.set(DATA_KEY, 'local-1');
            ctx.machine.send({ type: 'LOCAL_UPDATE' });

            await waitFor(() => server.snapshotCount === initialSnapshots + 1);
            await waitForSnapshotSync(ctx.container, server);

            expect(getValue(ctx.container, DATA_KEY)).toBe('local-1');
        } finally {
            ctx.machine.stop();
        }
    });

    it('receiving 1 update', async () => {
        const ctx = await createMachineContext(server, getMasterKey(2));
        const remote = await createMachineContext(server, getMasterKey(2));

        try {
            await sendLocalUpdate(remote, server, 'remote-1');
            await waitForSnapshotSync(ctx.container, server);

            expect(getValue(ctx.container, DATA_KEY)).toBe('remote-1');
        } finally {
            ctx.machine.stop();
            remote.machine.stop();
        }
    });

    it('receiving 2 updates', async () => {
        const ctx = await createMachineContext(server, getMasterKey(3));
        const remote = await createMachineContext(server, getMasterKey(3));

        try {
            await sendLocalUpdate(remote, server, 'remote-1');
            await waitForSnapshotSync(ctx.container, server);

            await sendLocalUpdate(remote, server, 'remote-2');
            await waitForSnapshotSync(ctx.container, server);

            expect(getValue(ctx.container, DATA_KEY)).toBe('remote-2');
        } finally {
            ctx.machine.stop();
            remote.machine.stop();
        }
    });

    it('alternating send and receive updates', async () => {
        const ctx = await createMachineContext(server, getMasterKey(4));
        const remote = await createMachineContext(server, getMasterKey(4));

        try {
            await sendLocalUpdate(ctx, server, 'local-1');

            await sendLocalUpdate(remote, server, 'remote-1');
            await waitForSnapshotSync(ctx.container, server);
            expect(getValue(ctx.container, DATA_KEY)).toBe('remote-1');

            await sendLocalUpdate(ctx, server, 'local-2');

            await sendLocalUpdate(remote, server, 'remote-2');
            await waitForSnapshotSync(ctx.container, server);
            expect(getValue(ctx.container, DATA_KEY)).toBe('remote-2');
        } finally {
            ctx.machine.stop();
            remote.machine.stop();
        }
    });

    it('syncs updates between two machines', async () => {
        const master = getMasterKey(5);
        const first = await createMachineContext(server, master);
        const second = await createMachineContext(server, master);

        try {
            await sendLocalUpdate(first, server, 'machine-1');
            await waitForSnapshotSync(second.container, server);
            expect(getValue(first.container, DATA_KEY)).toBe('machine-1');
            expect(getValue(second.container, DATA_KEY)).toBe('machine-1');

            await sendLocalUpdate(second, server, 'machine-2');
            await waitForSnapshotSync(first.container, server);
            expect(getValue(first.container, DATA_KEY)).toBe('machine-2');
            expect(getValue(second.container, DATA_KEY)).toBe('machine-2');
        } finally {
            first.machine.stop();
            second.machine.stop();
        }
    });
});

type MachineContext = {
    container: MockSyncContainer;
    machine: SyncMachine;
};

async function createMachineContext(
    server: MockSnapshotsServer,
    masterKey: Buffer,
    expectedSubscriberIncrease = 1
): Promise<MachineContext> {
    const storage = new InMemStorage();
    const keychainStorage = new InMemStorage();
    await initializeSyncAccount(storage, keychainStorage, masterKey);
    const container = await createMockSyncContainer(storage, keychainStorage, server);

    if (!server.hasSnapshot()) {
        const encrypted = await container.updateEncryptor.encryptAndSign(
            container.yManager.encodeAsSnapshot()
        );
        await server.seedFromSnapshot(encrypted);
    }

    const machine = createActor(createSyncMachine(), {
        input: {
            syncStateRepository: container.syncStateRepository,
            updateHandler: container.updateHandler,
            yManager: container.yManager,
            updateEncryptor: container.updateEncryptor,
            snapshotsApi: container.snapshotApi as unknown as SnapshotsApi,
            snapshotsSse: container.snapshotSse as unknown as SnapshotsSse,
            ikService: container.ikService
        }
    });

    const baseSubscribers = server.subscriberCount;
    machine.start();

    await waitFor(() => server.subscriberCount === baseSubscribers + expectedSubscriberIncrease);
    await waitForSnapshotSync(container, server);

    return { container, machine };
}

async function sendLocalUpdate(
    ctx: MachineContext,
    server: MockSnapshotsServer,
    value: string
): Promise<void> {
    const initialSnapshots = server.snapshotCount;
    await ctx.container.yManager.set(DATA_KEY, value);
    ctx.machine.send({ type: 'LOCAL_UPDATE' });

    await waitFor(() => server.snapshotCount === initialSnapshots + 1);
    await waitForSnapshotSync(ctx.container, server);
}

async function waitForSnapshotSync(
    container: MockSyncContainer,
    server: MockSnapshotsServer
): Promise<void> {
    await waitFor(async () => {
        const syncState = await container.syncStateRepository.getState();
        return syncState.snapshotProof.equals(server.getLatestSnapshotProof());
    });
}

function getValue(container: MockSyncContainer, key: string): string | undefined {
    const map = container.yManager.getDoc().getMap<string>('root');
    return map.get(key) ?? undefined;
}

function getMasterKey(seed: number): Buffer {
    return Buffer.alloc(32, seed);
}

async function waitFor(
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
