import { z } from 'zod';

import { Draft, NewOf, StorageVersion } from '@safely/slottree';

import { YCRDT } from './y-crdt';
import { YCRDTRepository } from './y-crdt-repository';
import { SyncError } from '../sync-error';

export class YManager<Latest extends StorageVersion, Rest> {
    private constructor(
        private readonly yRepository: YCRDTRepository<Latest, Rest>,
        private readonly yDoc: YCRDT<z.output<NewOf<Latest>>>
    ) {}

    public static async create<Latest extends StorageVersion, Rest>(
        yRepository: YCRDTRepository<Latest, Rest>
    ) {
        const yDoc = await yRepository.loadCRDT();
        return new YManager(yRepository, yDoc);
    }

    public async applyUpdate(update: Buffer, _origin: string): Promise<void> {
        this.yDoc.applyUpdate(update);
        await this.yRepository.saveCRDT(this.yDoc);
    }

    public async set(key: string, value: unknown): Promise<void> {
        this.yDoc.set(key as Extract<keyof z.output<NewOf<Latest>>, string>, value);
        await this.yRepository.saveCRDT(this.yDoc);
    }

    public async update(f: (draft: Draft<z.output<NewOf<Latest>>>) => void) {
        this.yDoc.update(f);
        await this.yRepository.saveCRDT(this.yDoc);
    }

    public getFull(): z.output<NewOf<Latest>> {
        return this.yDoc.getFull();
    }

    public get(key: string): unknown {
        const value = this.yDoc.get(key);
        if (value === undefined) {
            throw new StorageError(`Key "${key}" does not exist.`);
        }
        return value;
    }

    public equalsToRemoteUpdate(snapshot: Buffer): boolean {
        return this.yDoc.equals(snapshot.toString('utf8'));
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
}

export class StorageError extends SyncError {}
