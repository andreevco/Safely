import type { StorageVersion } from '@safely/slottree';

import type { SnapshotSender } from './snapshot-sender';
import { SyncOperationQueue } from './sync-operation-queue';
import type { EncryptedStateAndProofChain } from '../api/types';
import type { CrdtController } from '../crdt/crdt-controller';
import type { DmkSignerService } from '../crypto/service/dmk-signer-service';
import type { DeviceManagementService } from '../device-manager/device-management-service';
import type { UpdateHandler } from '../update-handler/handler';

export class SyncOperations<Latest extends StorageVersion, Rest> {
    private readonly queue = new SyncOperationQueue();

    constructor(
        private readonly updateHandler: UpdateHandler<Latest, Rest>,
        private readonly snapshotSender: SnapshotSender<Latest, Rest>,
        private readonly deviceManager: DeviceManagementService,
        private readonly crdtController: CrdtController
    ) {}

    public async applyRemoteUpdate(
        update: EncryptedStateAndProofChain,
        signal?: AbortSignal
    ): Promise<{ hasLocalChanges: boolean; revoked?: boolean }> {
        return await this.queue.run(async () => {
            this.throwIfAborted(signal);
            return await this.updateHandler.handle(update);
        });
    }

    public async pushLocalSnapshot(signal?: AbortSignal): Promise<void> {
        await this.queue.run(async () => {
            this.throwIfAborted(signal);
            await this.snapshotSender.sendCurrentSnapshot(signal);
        });
    }

    public async addDevice(
        ikPub: Buffer,
        storageVersion: number | undefined,
        dmkSignerService: DmkSignerService,
        signal?: AbortSignal
    ): Promise<void> {
        await this.queue.run(async () => {
            this.throwIfAborted(signal);
            await this.deviceManager.addDevice(ikPub, dmkSignerService);
            if (storageVersion !== undefined) {
                await this.crdtController.addAuthor(ikPub, storageVersion);
            }
        });
    }

    public async revokeDevice(
        ikPub: Buffer,
        dmkSignerService: DmkSignerService,
        signal?: AbortSignal
    ): Promise<void> {
        await this.queue.run(async () => {
            this.throwIfAborted(signal);
            await this.deviceManager.revokeDevice(ikPub, dmkSignerService);
            await this.crdtController.deleteAuthor(ikPub);
        });
    }

    private throwIfAborted(signal?: AbortSignal): void {
        if (!signal?.aborted) {
            return;
        }

        throw signal.reason instanceof Error ? signal.reason : new Error('Sync operation aborted');
    }
}
