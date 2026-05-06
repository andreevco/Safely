import { z } from 'zod';

import { AssertVersionHList, createStorage, HCons, NewOf, StorageVersion } from '@safely/slottree';

import { YCRDT } from './y-crdt';
import { IStorage } from '../I-storage';

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
        return this.createCRDTFromSnapshot(crdtRaw);
    }

    public createCRDTFromSnapshot(snapshot: Buffer | string): YCRDT<z.output<NewOf<Latest>>> {
        const crdt = createStorage({
            authorId: this.ikPub.toString('hex'),
            versions: this.versions
        });
        crdt.merge(Buffer.isBuffer(snapshot) ? snapshot.toString('utf8') : snapshot);
        return new YCRDT(crdt);
    }

    public async saveCRDT(crdt: YCRDT<z.output<NewOf<Latest>>>): Promise<void> {
        const crdt_buffer = crdt.encodeAsSnapshot();
        await this.storage.setItem(this.storageKey, crdt_buffer.toString('utf8'));
    }

    public async initialize(): Promise<void> {
        const crdt = createStorage({
            authorId: this.ikPub.toString('hex'),
            versions: this.versions
        });

        await this.storage.setItem(this.storageKey, crdt.export());
    }
}
