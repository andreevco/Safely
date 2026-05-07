import type { output, z, ZodType } from 'zod';

import type { ISyncProvider } from './I-sync-provider';
import { StorageError } from '../crdt/y-manager';
import type { SyncContainer } from '../sync-container';
import type { SyncError } from '../sync-error';
import { SyncStatus, SyncStatusManager } from './sync-status';

export class OfflineSyncProvider<S extends Record<string, ZodType>> implements ISyncProvider<S> {
    private readonly onErrorObservers = new Set<(e: SyncError) => void>();
    constructor(
        public readonly structure: S,
        protected readonly container: SyncContainer,
        public readonly syncStatusManager = new SyncStatusManager(SyncStatus.OFFLINE)
    ) {}

    public dispose(): void {
        // nothing to dispose in the base class, but subclasses can override this method to clean up resources
    }

    public restart() {
        // in offline mode, restart doesn't do anything
    }

    public get<K extends keyof S>(k: K): z.output<S[K]> {
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
        const schema = this.structure[k];
        return schema.parse(v);
    }

    public getAll(): { [K in keyof S]: output<S[K]> } {
        const result = {} as { [K in keyof S]: output<S[K]> };
        for (const k of Object.keys(this.structure) as Array<keyof S>) {
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
            const schema = this.structure[k];
            result[k] = schema.parse(v);
        }
        return result;
    }

    public async remove(k: keyof S): Promise<void> {
        await this.container.yManager.remove(k.toString());
    }

    public async set<K extends keyof S>(k: K, v: z.input<S[K]> | string): Promise<void> {
        this.container.logger.info('SyncProvider.set<K>', k.toString());
        this.structure[k].parse(v);
        await this.container.yManager.set(k.toString(), v);
    }

    public onChange<K extends keyof S>(k: K, observer: (v: z.output<S[K]>) => void): () => void {
        let lastStored: unknown;
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
            if (lastStored !== undefined && v === lastStored) {
                return;
            }
            const schema = this.structure[k];
            let value: z.output<S[K]>;
            try {
                value = schema.parse(v);
            } catch {
                return;
            }
            lastStored = v;
            observer(value);
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
