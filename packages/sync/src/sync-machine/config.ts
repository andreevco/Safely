import type { StorageVersion } from '@safely/slottree';

import type { ErrorDisposition } from './error-handler';
import type { SnapshotsApi } from '../api/generated';
import type { SnapshotsSse } from '../api/snapshots-sse';
import type { EncryptedState } from '../api/types';
import type { CrdtManager } from '../crdt/crdt-manager';
import type { tDevicesLatest, tDevicesRest } from '../device-manager/device-storage-schema';
import type { Logger } from '../logger/logger';
import type { SyncOperations } from '../sync-operations/sync-operations';
import type { SyncStatusManager } from '../sync-provider/sync-status';
import type { SyncStateRepository } from '../update-handler/sync-state-repository';

export type SyncMachineInput<Latest extends StorageVersion, Rest> = {
    syncStateRepository: SyncStateRepository;
    deviceYManager: CrdtManager<tDevicesLatest, tDevicesRest>;
    snapshotsApi: SnapshotsApi;
    snapshotsSse: SnapshotsSse;
    syncOperations: SyncOperations<Latest, Rest>;
    syncStatusManager: SyncStatusManager;
    logger: Logger;
};

export type SyncMachineConfig<Latest extends StorageVersion, Rest> = SyncMachineInput<
    Latest,
    Rest
> & {
    localUpdateVersion: number;
    transmittingLocalUpdateVersion: number;
    acknowledgedLocalUpdateVersion: number;
    remoteUpdates: EncryptedState[];
    reconnectAttempt: number;
    reconnectDelayMs: number;
    lastError?: ErrorDisposition;
};

export function defaultConfig<Latest extends StorageVersion, Rest>(
    input: SyncMachineInput<Latest, Rest>
): SyncMachineConfig<Latest, Rest> {
    return {
        ...input,
        localUpdateVersion: 0,
        transmittingLocalUpdateVersion: 0,
        acknowledgedLocalUpdateVersion: 0,
        reconnectAttempt: 0,
        reconnectDelayMs: 0,
        remoteUpdates: []
    };
}
