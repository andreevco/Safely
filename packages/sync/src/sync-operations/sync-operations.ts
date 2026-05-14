import type { SnapshotSender } from './snapshot-sender';
import { SyncOperationQueue } from './sync-operation-queue';
import type { EncryptedStateAndProofChain } from '../api/types';
import type { DmkSignerService } from '../crypto/service/dmk-signer-service';
import type { DeviceManagementService } from '../device-manager/device-management-service';
import type { UpdateHandler } from '../update-handler/handler';

export class SyncOperations {
    private readonly queue = new SyncOperationQueue();

    constructor(
        private readonly updateHandler: UpdateHandler,
        private readonly snapshotSender: SnapshotSender,
        private readonly deviceManager: DeviceManagementService
    ) {}

    public async applyRemoteUpdate(
        update: EncryptedStateAndProofChain,
        signal?: AbortSignal
    ): Promise<{ hasLocalChanges: boolean }> {
        return await this.queue.run(async () => {
            this.throwIfAborted(signal);
            return await this.updateHandler.handle(update);
        });
    }

    public async pushLocalSnapshot(signal?: AbortSignal): Promise<void> {
        await this.queue.run(async () => {
            this.throwIfAborted(signal);
            await this.snapshotSender.sendCurrentSnapshot();
        });
    }

    public async addDevice(
        ikPub: Buffer,
        dmkSignerService: DmkSignerService,
        signal?: AbortSignal
    ): Promise<void> {
        await this.queue.run(async () => {
            this.throwIfAborted(signal);
            await this.deviceManager.addDevice(ikPub, dmkSignerService);
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
        });
    }

    private throwIfAborted(signal?: AbortSignal): void {
        if (!signal?.aborted) {
            return;
        }

        throw signal.reason instanceof Error ? signal.reason : new Error('Sync operation aborted');
    }
}
