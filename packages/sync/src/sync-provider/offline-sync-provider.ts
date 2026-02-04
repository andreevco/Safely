import { z, ZodType } from 'zod';

import { ISyncProvider } from './I-sync-provider';
import { SyncContainer } from '../sync-container';
import { SyncError } from '../sync-error';

export class OfflineSyncProvider<S extends Record<string, ZodType>> implements ISyncProvider<S> {
    private readonly onErrorObservers = new Set<(e: SyncError) => void>();

    constructor(
        public readonly structure: S,
        protected readonly container: SyncContainer,
        public readonly type: 'online' | 'offline' = 'offline' as const
    ) {}

    public dispose(): void {
        // nothing to dispose in the base class, but subclasses can override this method to clean up resources
    }

    public async get<K extends keyof S>(k: K): Promise<z.output<S[K]>> {
        const v = this.container.yManager.get(k.toString());
        const schema = this.structure[k];
        return schema.parse(JSON.parse(v));
    }

    public async remove(k: keyof S): Promise<void> {
        await this.container.yManager.remove(k.toString());
    }

    public async set<K extends keyof S>(k: K, v: z.input<S[K]> | string): Promise<void> {
        this.structure[k].parse(v);
        await this.container.yManager.set(k.toString(), JSON.stringify(v));
    }

    public onChange<K extends keyof S>(k: K, observer: (v: z.output<S[K]>) => void): () => void {
        return this.container.yManager.onChange(() => {
            const schema = this.structure[k];
            const valueString = this.container.yManager.get(JSON.stringify(k));
            const value = schema.parse(JSON.parse(valueString));
            observer(value);
        });
    }

    public onError(obs: (e: SyncError) => void): () => void {
        this.onErrorObservers.add(obs);
        return () => {
            this.onErrorObservers.delete(obs);
        };
    }

    public async triggerSync(): Promise<void> {
        // in offline mode, triggerSync doesn't do anything
    }
}
