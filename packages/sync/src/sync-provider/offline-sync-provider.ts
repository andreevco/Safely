import type { output, z } from 'zod';

import type { Draft, NewOf, SlotRevision, StorageVersion } from '@safely/slottree';

import type { ISyncProvider } from './I-sync-provider';
import { KeyNotFoundError } from '../crdt/y-manager';
import type { Device } from '../device-manager/device-repository';
import type { SyncContainer } from '../sync-container';
import type { SyncError } from '../sync-error';
import { SyncStatus, SyncStatusManager } from './sync-status';

export class OfflineSyncProvider<Latest extends StorageVersion, Rest> implements ISyncProvider<
    NewOf<Latest>
> {
    private readonly onErrorObservers = new Set<(e: SyncError) => void>();
    constructor(
        protected readonly container: SyncContainer<Latest, Rest>,
        public readonly syncStatusManager = new SyncStatusManager(SyncStatus.OFFLINE)
    ) {}

    public dispose(): void {
        // nothing to dispose in the base class, but subclasses can override this method to clean up resources
    }

    public restart() {
        // in offline mode, restart doesn't do anything
    }

    public get<K extends keyof NewOf<Latest>>(k: K): z.output<NewOf<Latest>[K]> {
        const v = this.getOrNull(k);
        return v as z.output<NewOf<Latest>[K]>;
    }

    public getAll(): z.output<NewOf<Latest>> {
        return this.container.yManager.getFull();
    }

    public get hasNewerStorageVersions(): boolean {
        return this.container.yManager.hasNewerStorageVersions;
    }

    public async transaction(f: (draft: Draft<z.output<NewOf<Latest>>>) => void): Promise<void> {
        this.container.logger.info('SyncProvider.update');
        await this.container.yManager.transaction(f);
    }

    public onChange<K extends keyof NewOf<Latest>>(
        k: K,
        observer: (v: z.output<NewOf<Latest>[K]>) => void
    ): () => void {
        let lastRevision: SlotRevision | undefined;
        return this.container.yManager.onChange(() => {
            const v = this.getOrNull(k);

            const currentRevision = this.container.yManager.getTopLevelRevision(
                k.toString() as Extract<keyof z.output<NewOf<Latest>>, string>
            );
            if (
                currentRevision === undefined
                    ? lastRevision === undefined
                    : lastRevision !== undefined && currentRevision.compare(lastRevision) === 0
            ) {
                return;
            }

            lastRevision = currentRevision;
            observer(v as z.output<NewOf<Latest>[K]>);
        });
    }

    public onDevicesChange(observer: (devices: Device[]) => void): () => void {
        return this.container.deviceYManager.onChange(() => {
            void this.container.deviceManager.getDevices().then(devices => {
                observer(devices);
            });
        });
    }

    public onError(obs: (e: SyncError) => void): () => void {
        this.onErrorObservers.add(obs);
        return () => {
            this.onErrorObservers.delete(obs);
        };
    }

    public async waitForInitialSync(): Promise<void> {
        // in offline mode, data is always available locally
    }

    public triggerSync(): void {
        // in offline mode, triggerSync doesn't do anything
    }

    private getOrNull<K extends keyof NewOf<Latest>>(k: K): unknown {
        try {
            return this.container.yManager.get(k.toString());
        } catch (e) {
            if (e instanceof KeyNotFoundError) {
                return null;
            }

            throw e;
        }
    }
}
