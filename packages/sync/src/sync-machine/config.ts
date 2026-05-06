import { StorageVersion } from '@safely/slottree';

import { ErrorDisposition } from './error-handler';
import { SnapshotsApi } from '../api/generated';
import { SnapshotsSse } from '../api/snapshots-sse';
import { EncryptedState } from '../api/types';
import { YManager } from '../crdt/y-manager';
import { IkService } from '../crypto/service/ik-service';
import { tDevicesLatest, tDevicesRest } from '../device-manager/device-storage-schema';
import { Logger } from '../logger/logger';
import { SyncStatusManager } from '../sync-provider/sync-status';
import { UpdateEncryptorService } from '../update-encryptor/update-encryptor-service';
import { UpdateHandler } from '../update-handler/handler';
import { SyncStateRepository } from '../update-handler/sync-state-repository';

export type SyncMachineInput<Latest extends StorageVersion, Rest> = {
    syncStateRepository: SyncStateRepository;
    updateEncryptor: UpdateEncryptorService;
    updateHandler: UpdateHandler<Latest, Rest>;
    yManager: YManager<Latest, Rest>;
    deviceYManager: YManager<tDevicesLatest, tDevicesRest>;
    snapshotsApi: SnapshotsApi;
    snapshotsSse: SnapshotsSse;
    ikService: IkService;
    syncStatusManager: SyncStatusManager;
    logger: Logger;
};

export type SyncMachineConfig<Latest extends StorageVersion, Rest> = SyncMachineInput<
    Latest,
    Rest
> & {
    shouldSendUpdate: boolean;
    remoteUpdates: EncryptedState[];
    lastError?: ErrorDisposition;
};

export function defaultConfig<Latest extends StorageVersion, Rest>(
    input: SyncMachineInput<Latest, Rest>
): SyncMachineConfig<Latest, Rest> {
    return {
        ...input,
        shouldSendUpdate: false,
        remoteUpdates: []
    };
}
