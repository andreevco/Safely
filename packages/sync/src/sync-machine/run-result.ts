import type { SyncMachine } from './machine';
import { SyncStatus, type SyncStatusManager } from '../sync-provider/sync-status';
import { waitForChange } from '../utils/wait-for-change';

export enum SyncMachineRunResult {
    SYNCHRONIZED = 'synchronized',
    DEVICE_DELETED = 'device_deleted'
}

export class SyncMachineRunTimeoutError extends Error {
    constructor(timeout: number) {
        super(`Timed out waiting for sync machine run result after ${timeout}ms`);
    }
}

export class SyncMachineRunAbortedError extends Error {
    constructor() {
        super('Sync machine run was aborted');
    }
}

export async function waitForSyncMachineRunResult(opts: {
    syncMachine: SyncMachine;
    syncStatusManager: SyncStatusManager;
    timeout: number;
    signal?: AbortSignal;
}): Promise<SyncMachineRunResult> {
    let result = getSyncMachineRunResult(opts.syncMachine, opts.syncStatusManager);

    if (result !== null) {
        return result;
    }

    await waitForChange({
        subscribe: observer => {
            const subscription = opts.syncMachine.subscribe(() => {
                observer();
            });
            return () => {
                subscription.unsubscribe();
            };
        },
        predicate: () => {
            result = getSyncMachineRunResult(opts.syncMachine, opts.syncStatusManager);
            return result !== null;
        },
        timeoutMs: opts.timeout,
        timeoutError: () => new SyncMachineRunTimeoutError(opts.timeout),
        signal: opts.signal,
        abortError: () => new SyncMachineRunAbortedError()
    });

    if (result === null) {
        throw new SyncMachineRunTimeoutError(opts.timeout);
    }

    return result;
}

function getSyncMachineRunResult(
    syncMachine: SyncMachine,
    syncStatusManager: SyncStatusManager
): SyncMachineRunResult | null {
    const snapshot = syncMachine.getSnapshot();

    if (
        snapshot.matches('connectionSession') &&
        syncStatusManager.getStatus() === SyncStatus.SYNCHRONIZED
    ) {
        return SyncMachineRunResult.SYNCHRONIZED;
    }

    if (snapshot.matches('fatalError')) {
        return SyncMachineRunResult.DEVICE_DELETED;
    }

    return null;
}
