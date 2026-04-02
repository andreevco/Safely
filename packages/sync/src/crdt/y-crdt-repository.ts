import * as Y from 'yjs';

import { ICRDTRepository } from './I-crdt-repository';
import { YCRDT } from './y-crdt';
import { IStorage } from '../I-storage';

export class YCRDTRepository implements ICRDTRepository<YCRDT> {
    constructor(private readonly storage: IStorage) {}

    public async loadCRDT(): Promise<YCRDT> {
        const crdt_raw = await this.storage.getItem('crdt');
        const ydoc = new Y.Doc();
        if (!crdt_raw) {
            throw new Error('CRDT not found in storage');
        }
        const crdt_buffer = Buffer.from(crdt_raw, 'hex');
        Y.applyUpdateV2(ydoc, crdt_buffer);
        return new YCRDT(ydoc);
    }

    public async saveCRDT(crdt: YCRDT): Promise<void> {
        const crdt_buffer = crdt.encodeAsSnapshot();
        await this.storage.setItem('crdt', crdt_buffer.toString('hex'));
    }
}
