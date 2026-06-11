import type { z } from 'zod';

import type { Draft, NewOf, SlotRevision, StorageVersion } from '@safely/slottree';

import type { YCRDT } from './y-crdt';
import type { YCRDTRepository } from './y-crdt-repository';
import { SyncError } from '../sync-error';

type State<T> = z.output<NewOf<T>>;

export class YManager<Latest extends StorageVersion, Rest> {
    private writeQueue: Promise<void> = Promise.resolve();

    private constructor(
        private readonly yRepository: YCRDTRepository<Latest, Rest>,
        private readonly yDoc: YCRDT<State<Latest>>
    ) {}

    public static async create<Latest extends StorageVersion, Rest>(
        yRepository: YCRDTRepository<Latest, Rest>
    ) {
        const yDoc = await yRepository.loadCRDT();
        return new YManager(yRepository, yDoc);
    }

    public async applyUpdate(update: Buffer, _origin: string): Promise<void> {
        await this.enqueueWrite(async () => {
            // unsafeAsyncApplyUpdate can race when called concurrently; YManager
            // serializes all writes through enqueueWrite before using it.
            await this.yDoc.unsafeAsyncApplyUpdate(update, async snapshot => {
                await this.yRepository.saveSnapshot(snapshot);
                return true;
            });
        });
    }

    public async transaction(f: (draft: Draft<z.output<NewOf<Latest>>>) => void) {
        await this.enqueueWrite(async () => {
            // unsafeAsyncTransaction can race when called concurrently; YManager
            // serializes all writes through enqueueWrite before using it.
            await this.yDoc.unsafeAsyncTransaction(f, async snapshot => {
                await this.yRepository.saveSnapshot(snapshot);
                return true;
            });
        });
    }

    public async addAuthor(authorId: Buffer, storageVersion: number): Promise<void> {
        await this.enqueueWrite(async () => {
            this.yDoc.addAuthor(authorId, storageVersion);
            await this.yRepository.saveSnapshot(this.yDoc.encodeAsSnapshot());
        });
    }

    public async deleteAuthor(authorId: Buffer): Promise<void> {
        await this.enqueueWrite(async () => {
            this.yDoc.deleteAuthor(authorId);
            await this.yRepository.saveSnapshot(this.yDoc.encodeAsSnapshot());
        });
    }

    public getFull(): z.output<NewOf<Latest>> {
        return this.yDoc.getFull();
    }

    public get(key: string): unknown {
        const value = this.yDoc.get(key);
        if (value === undefined) {
            throw new KeyNotFoundError(`Key "${key}" does not exist.`);
        }
        return value;
    }

    public getTopLevelRevision(
        key: Extract<keyof State<Latest>, string>
    ): SlotRevision | undefined {
        return this.yDoc.getTopLevelRevision(key);
    }

    public equalsToRemoteUpdate(snapshot: Buffer): boolean {
        return this.yDoc.equals(snapshot);
    }

    public encodeAsSnapshot(): Buffer {
        return this.yDoc.encodeAsSnapshot();
    }

    public readSnapshot(snapshot: Buffer): z.output<NewOf<Latest>> {
        return this.yRepository.createCRDTFromSnapshot(snapshot).getFull();
    }

    public onChange(observer: () => void): () => void {
        return this.yDoc.onUpdate(observer);
    }

    private async enqueueWrite<T>(operation: () => Promise<T>): Promise<T> {
        const result = this.writeQueue.then(operation, operation);
        this.writeQueue = result.then(
            () => undefined,
            () => undefined
        );
        return await result;
    }
}

export class KeyNotFoundError extends SyncError {}
