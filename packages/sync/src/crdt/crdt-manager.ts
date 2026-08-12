import type { z } from 'zod';

import type { Draft, NewOf, SlotRevision, StorageVersion } from '@safely/slottree';

import type { CRDT } from './crdt';
import type { CrdtRepository } from './crdt-repository';
import { SyncError } from '../sync-error';
import { AsyncOperationQueue } from '../utils/async-operation-queue';

type State<T> = z.output<NewOf<T>>;

export class CrdtManager<Latest extends StorageVersion, Rest> {
    private readonly writeQueue = new AsyncOperationQueue();

    private constructor(
        private readonly crdtRepository: CrdtRepository<Latest, Rest>,
        private readonly crdt: CRDT<State<Latest>>
    ) {}

    public static async create<Latest extends StorageVersion, Rest>(
        yRepository: CrdtRepository<Latest, Rest>
    ) {
        const yDoc = await yRepository.loadCRDT();
        return new CrdtManager(yRepository, yDoc);
    }

    public async applyUpdate(update: Buffer, _origin: string): Promise<void> {
        await this.writeQueue.run(async () => {
            // unsafeAsyncApplyUpdate can race when called concurrently; CrdtManager
            // serializes all writes through writeQueue before using it.
            await this.crdt.unsafeAsyncApplyUpdate(update, async snapshot => {
                await this.crdtRepository.saveSnapshot(snapshot);
                return true;
            });
        });
    }

    public async transaction(f: (draft: Draft<z.output<NewOf<Latest>>>) => void) {
        await this.writeQueue.run(async () => {
            // unsafeAsyncTransaction can race when called concurrently; CrdtManager
            // serializes all writes through writeQueue before using it.
            await this.crdt.unsafeAsyncTransaction(f, async snapshot => {
                await this.crdtRepository.saveSnapshot(snapshot);
                return true;
            });
        });
    }

    public async addAuthor(authorId: Buffer, storageVersion: number): Promise<void> {
        // Technically, there is no need for a write queue here, but it is added for consistency
        // with other write methods
        await this.writeQueue.run(async () => {
            this.crdt.addAuthor(authorId, storageVersion);
            await this.crdtRepository.saveSnapshot(this.crdt.encodeAsSnapshot());
        });
    }

    public async deleteAuthor(authorId: Buffer): Promise<void> {
        // Technically, there is no need for a write queue here, but it is added for consistency
        // with other write methods
        await this.writeQueue.run(async () => {
            this.crdt.deleteAuthor(authorId);
            await this.crdtRepository.saveSnapshot(this.crdt.encodeAsSnapshot());
        });
    }

    public getFull(): z.output<NewOf<Latest>> {
        return this.crdt.getFull();
    }

    public get hasNewerStorageVersions(): boolean {
        return this.crdt.hasNewerStorageVersions;
    }

    public get(key: string): unknown {
        const value = this.crdt.get(key);
        if (value === undefined) {
            throw new KeyNotFoundError(`Key "${key}" does not exist.`);
        }
        return value;
    }

    public getTopLevelRevision(
        key: Extract<keyof State<Latest>, string>
    ): SlotRevision | undefined {
        return this.crdt.getTopLevelRevision(key);
    }

    public equalsToRemoteUpdate(snapshot: Buffer): boolean {
        return this.crdt.equals(snapshot);
    }

    public encodeAsSnapshot(): Buffer {
        return this.crdt.encodeAsSnapshot();
    }

    public readSnapshot(snapshot: Buffer): z.output<NewOf<Latest>> {
        return this.crdtRepository.createCRDTFromSnapshot(snapshot).getFull();
    }

    public onChange(observer: () => void): () => void {
        return this.crdt.onUpdate(observer);
    }
}

export class KeyNotFoundError extends SyncError {}
