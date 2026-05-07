import type { ErrorDisposition } from './error-handler';
import type { SnapshotsApi } from '../api/generated';
import type { SnapshotsSse } from '../api/snapshots-sse';
import type { EncryptedState } from '../api/types';
import type { YManager } from '../crdt/y-manager';
import type { IkService } from '../crypto/service/ik-service';
import type { Logger } from '../logger/logger';
import type { SyncStatusManager } from '../sync-provider/sync-status';
import type { UpdateEncryptorService } from '../update-encryptor/update-encryptor-service';
import type { UpdateHandler } from '../update-handler/handler';
import type { SyncStateRepository } from '../update-handler/sync-state-repository';

export type SyncMachineInput = {
    syncStateRepository: SyncStateRepository;
    updateEncryptor: UpdateEncryptorService;
    updateHandler: UpdateHandler;
    yManager: YManager;
    snapshotsApi: SnapshotsApi;
    snapshotsSse: SnapshotsSse;
    ikService: IkService;
    syncStatusManager: SyncStatusManager;
    logger: Logger;
};

export type SyncMachineConfig = SyncMachineInput & {
    shouldSendUpdate: boolean;
    remoteUpdates: EncryptedState[];
    lastError?: ErrorDisposition;
};

export function defaultConfig(input: SyncMachineInput): SyncMachineConfig {
    return {
        ...input,
        shouldSendUpdate: false,
        remoteUpdates: []
    };
}
