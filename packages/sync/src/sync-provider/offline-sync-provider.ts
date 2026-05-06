import { output, z } from 'zod';

import { NewOf, StorageVersion } from '@safely/slottree';

import { ISyncProvider } from './I-sync-provider';
import { StorageError } from '../crdt/y-manager';
import { SyncContainer } from '../sync-container';
import { SyncError } from '../sync-error';
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
        let v: unknown;
        try {
            v = this.container.yManager.get(k.toString());
        } catch (e) {
            if (e instanceof StorageError) {
                v = null;
            } else {
                throw e;
            }
        }
        return v as z.output<NewOf<Latest>[K]>;
    }

    public getAll(): z.output<NewOf<Latest>> {
        return this.container.yManager.getFull();
    }

    public async set<K extends keyof NewOf<Latest>>(
        k: K,
        v: z.input<NewOf<Latest>[K]> | string
    ): Promise<void> {
        this.container.logger.info('SyncProvider.set<K>', k.toString());
        await this.container.yManager.set(k.toString(), v);
    }

    public onChange<K extends keyof NewOf<Latest>>(
        k: K,
        observer: (v: z.output<NewOf<Latest>[K]>) => void
    ): () => void {
        let lastStored: string | undefined;
        return this.container.yManager.onChange(() => {
            let v: unknown;
            try {
                v = this.container.yManager.get(k.toString());
            } catch (e) {
                if (e instanceof StorageError) {
                    v = null;
                } else {
                    throw e;
                }
            }

            // TODO: remove this ugliness and do proper change checks through timestamps.
            const currentStored = JSON.stringify(v);
            if (lastStored !== undefined && currentStored === lastStored) {
                return;
            }

            lastStored = currentStored;
            observer(v as z.output<NewOf<Latest>[K]>);
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
}
