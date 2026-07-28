import { afterEach, describe, expect, it, vi } from 'vitest';

import {
    SyncStatus,
    SyncStatusManager,
    SyncStatusTimeoutError
} from '../../src/sync-provider/sync-status';

describe('SyncStatusManager', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('rejects waitForStatus when timeout expires', async () => {
        vi.useFakeTimers();
        const manager = new SyncStatusManager(SyncStatus.DISCONNECTED);

        const promise = manager.waitForStatus(SyncStatus.SYNCHRONIZED, { timeout: 1000 });
        const expectation = expect(promise).rejects.toBeInstanceOf(SyncStatusTimeoutError);
        await vi.advanceTimersByTimeAsync(1000);

        await expectation;
    });

    it('resolves waitForStatus before timeout expires', async () => {
        vi.useFakeTimers();
        const manager = new SyncStatusManager(SyncStatus.DISCONNECTED);

        const promise = manager.waitForStatus(SyncStatus.SYNCHRONIZED, { timeout: 1000 });
        manager.setStatus(SyncStatus.SYNCHRONIZED);
        await vi.advanceTimersByTimeAsync(1000);

        await expect(promise).resolves.toBeUndefined();
    });
});
