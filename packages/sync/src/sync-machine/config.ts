import { SnapshotsApi } from '../api/generated';
import { SnapshotsSse } from '../api/snapshots-sse';
import { EncryptedState } from '../api/types';
import { YManager } from '../crdt/y-manager';
import { IkService } from '../crypto/service/ik-service';
import { Logger } from '../logger/logger';
import { SyncStatusManager } from '../sync-provider/sync-status';
import { UpdateEncryptorService } from '../update-encryptor/update-encryptor-service';
import { UpdateHandler } from '../update-handler/handler';
import { SyncStateRepository } from '../update-handler/sync-state-repository';

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
};

export function defaultConfig(input: SyncMachineInput): SyncMachineConfig {
    return {
        ...input,
        shouldSendUpdate: false,
        remoteUpdates: []
    };
}
