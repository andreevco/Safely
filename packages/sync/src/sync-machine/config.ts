import type { ErrorDisposition } from './error-handler';
import type { SnapshotsApi } from '../api/generated';
import type { SnapshotsSse } from '../api/snapshots-sse';
import type { EncryptedState } from '../api/types';
import type { Logger } from '../logger/logger';
import type { SyncOperations } from '../sync-operations/sync-operations';
import type { SyncStatusManager } from '../sync-provider/sync-status';
import type { SyncStateRepository } from '../update-handler/sync-state-repository';

export type SyncMachineInput = {
    syncStateRepository: SyncStateRepository;
    snapshotsApi: SnapshotsApi;
    snapshotsSse: SnapshotsSse;
    syncOperations: SyncOperations;
    syncStatusManager: SyncStatusManager;
    logger: Logger;
};

export type SyncMachineConfig = SyncMachineInput & {
    shouldSendUpdate: boolean;
    remoteUpdates: EncryptedState[];
    reconnectAttempt: number;
    lastError?: ErrorDisposition;
};

export function defaultConfig(input: SyncMachineInput): SyncMachineConfig {
    return {
        ...input,
        shouldSendUpdate: false,
        reconnectAttempt: 0,
        remoteUpdates: []
    };
}
