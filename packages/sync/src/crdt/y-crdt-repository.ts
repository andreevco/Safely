import * as Y from 'yjs';

import { YCRDT } from './y-crdt';
import { IStorage } from '../I-storage';
import { AnyStorageVersion } from './version';

export class YCRDTRepository {
    constructor(
        private readonly storage: IStorage,
        private readonly versions: AnyStorageVersion[],
        private readonly myDeviceId: string
    ) {}

    public async loadCRDT(): Promise<YCRDT> {
        const crdt_raw = await this.storage.getItem('crdt');
        const ydoc = new Y.Doc();
        if (!crdt_raw) {
            throw new Error('CRDT not found in storage');
        }
        const crdt_buffer = Buffer.from(crdt_raw, 'hex');
        Y.applyUpdateV2(ydoc, crdt_buffer);
        return YCRDT.create(ydoc, this.versions, this.myDeviceId);
    }

    public async saveCRDT(crdt: YCRDT): Promise<void> {
        const crdt_buffer = crdt.encodeAsSnapshot();
        await this.storage.setItem('crdt', crdt_buffer.toString('hex'));
    }
}
