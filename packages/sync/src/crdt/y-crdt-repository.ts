import type { z } from 'zod';

import type { AssertVersionHList, HCons, NewOf, StorageVersion } from '@safely/slottree';
import { createStorage } from '@safely/slottree';

import { YCRDT } from './y-crdt';
import type { IStorage } from '../I-storage';

export class YCRDTRepository<Latest extends StorageVersion, Rest> {
    constructor(
        private readonly storage: IStorage,
        private readonly ikPub: Buffer,
        private readonly versions: HCons<Latest, Rest> & AssertVersionHList<HCons<Latest, Rest>>,
        private readonly storageKey = 'crdt'
    ) {}

    public async loadCRDT(): Promise<YCRDT<z.output<NewOf<Latest>>>> {
        let crdtRaw = await this.storage.getItem(this.storageKey);
        if (!crdtRaw) {
            // TODO: fix
            await this.initialize();
            crdtRaw = await this.storage.getItem(this.storageKey);
            if (!crdtRaw) {
                throw new Error('CRDT not found in storage');
            }
        }
        const crdt = this.createCRDTFromSnapshot(crdtRaw);
        const snapshot = crdt.encodeAsSnapshot();
        if (!snapshot.equals(Buffer.from(crdtRaw, 'utf8'))) {
            await this.saveSnapshot(snapshot);
        }
        return crdt;
    }

    public createCRDTFromSnapshot(snapshot: Buffer | string): YCRDT<z.output<NewOf<Latest>>> {
        const crdt = createStorage({
            authorId: this.ikPub,
            versions: this.versions
        });
        crdt.merge(Buffer.isBuffer(snapshot) ? snapshot.toString('utf8') : snapshot);
        return new YCRDT(crdt);
    }

    public async saveCRDT(crdt: YCRDT<z.output<NewOf<Latest>>>): Promise<void> {
        await this.saveSnapshot(crdt.encodeAsSnapshot());
    }

    public async saveSnapshot(snapshot: Buffer | string): Promise<void> {
        await this.storage.setItem(
            this.storageKey,
            Buffer.isBuffer(snapshot) ? snapshot.toString('utf8') : snapshot
        );
    }

    public async initialize(): Promise<void> {
        const crdt = createStorage({
            authorId: this.ikPub,
            versions: this.versions
        });

        await this.storage.setItem(this.storageKey, crdt.export());
    }
}
