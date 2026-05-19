import { beforeEach, describe, expect, it } from 'vitest';

import { MockSnapshotsServer } from './mocks/mock-snapshots-api';
import type { MockSyncContainer } from './mocks/mock-sync-container';
import {
    createMachineContext,
    getMasterKey,
    sendLocalUpdate,
    waitFor,
    waitForSnapshotSync
} from './mocks/mock-sync-context';

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
            await sendLocalUpdate(remote, server, DATA_KEY, 'remote-1');
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
            await sendLocalUpdate(remote, server, DATA_KEY, 'remote-1');
            await waitForSnapshotSync(ctx.container, server);

            await sendLocalUpdate(remote, server, DATA_KEY, 'remote-2');
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
            await sendLocalUpdate(ctx, server, DATA_KEY, 'local-1');

            await sendLocalUpdate(remote, server, DATA_KEY, 'remote-1');
            await waitForSnapshotSync(ctx.container, server);
            expect(getValue(ctx.container, DATA_KEY)).toBe('remote-1');

            await sendLocalUpdate(ctx, server, DATA_KEY, 'local-2');

            await sendLocalUpdate(remote, server, DATA_KEY, 'remote-2');
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
            await sendLocalUpdate(first, server, DATA_KEY, 'machine-1');
            await waitForSnapshotSync(second.container, server);
            expect(getValue(first.container, DATA_KEY)).toBe('machine-1');
            expect(getValue(second.container, DATA_KEY)).toBe('machine-1');

            await sendLocalUpdate(second, server, DATA_KEY, 'machine-2');
            await waitForSnapshotSync(first.container, server);
            expect(getValue(first.container, DATA_KEY)).toBe('machine-2');
            expect(getValue(second.container, DATA_KEY)).toBe('machine-2');
        } finally {
            first.machine.stop();
            second.machine.stop();
        }
    });
});

function getValue(container: MockSyncContainer, key: string): string | undefined {
    const map = container.yManager.getDoc().getMap<string>('root');
    return map.get(key) ?? undefined;
}
