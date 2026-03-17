import * as Y from 'yjs';
import { z } from 'zod';

import { YCRDT } from './y-crdt';
import { YCRDTRepository } from './y-crdt-repository';
import { SyncError } from '../sync-error';
import { BufferHexSchema } from '../utils/schemas';

export class YManager {
    private constructor(
        private readonly yRepository: YCRDTRepository,
        private readonly yDoc: YCRDT
    ) {}

    public static async create(yRepository: YCRDTRepository) {
        const yDoc = await yRepository.loadCRDT();
        return new YManager(yRepository, yDoc);
    }

    public async applyUpdate(update: Buffer, origin: string): Promise<void> {
        this.yDoc.applyUpdate(update, origin);
        await this.yRepository.saveCRDT(this.yDoc);
    }

    public async set(key: string, value: string): Promise<void> {
        this.yDoc.set(key, value);
        await this.yRepository.saveCRDT(this.yDoc);
    }

    public get(key: string): string {
        const value = this.yDoc.get(key);
        if (value === null) {
            throw new StorageError(`Key "${key}" does not exist.`);
        }
        return value;
    }

    public async getDeviceLog(): Promise<DeviceOp[]> {
        const deviceLog = this.yDoc.getArray('devices');
        return deviceLog.toArray().map(x => DeviceOpSchema.parse(JSON.parse(x)));
    }

    public async addDeviceOp(op: DeviceOp): Promise<void> {
        const deviceLog = this.yDoc.getArray('devices');
        deviceLog.push([deviceOpToJson(op)]);
        await this.yRepository.saveCRDT(this.yDoc);
    }

    public async remove(key: string): Promise<void> {
        this.yDoc.remove(key);
        await this.yRepository.saveCRDT(this.yDoc);
    }

    public equalsToRemoteUpdate(snapshot: Buffer): boolean {
        const remoteDoc = new YCRDT(new Y.Doc());
        remoteDoc.applyUpdate(snapshot, 'remote');

        return this.yDoc.equals(remoteDoc);
    }

    public encodeAsSnapshot(): Buffer {
        return this.yDoc.encodeAsSnapshot();
    }

    public onChange(observer: (snapshot: Buffer) => void): () => void {
        return this.yDoc.onUpdate((update: Buffer) => {
            observer(update);
        });
    }

    public getDoc(): Y.Doc {
        return this.yDoc.toRaw();
    }
}

export class StorageError extends SyncError {}

export type DeviceOp = {
    type: 'add' | 'revoke';
    ikPub: Buffer;
    ts: number;
    kid: Buffer;
    sig: Buffer;
};

export function deviceOpIsEquals(op1: DeviceOp, op2: DeviceOp): boolean {
    return (
        op1.type === op2.type &&
        op1.ikPub.equals(op2.ikPub) &&
        op1.ts === op2.ts &&
        op1.sig.equals(op2.sig)
    );
}

export function deviceOpToJson(op: DeviceOp): string {
    return JSON.stringify({
        type: op.type,
        ikPub: op.ikPub.toString('hex'),
        ts: op.ts,
        kid: op.kid.toString('hex'),
        sig: op.sig.toString('hex')
    });
}

export const DeviceOpSchema = z.object({
    type: z.enum(['add', 'revoke']),
    ikPub: BufferHexSchema,
    ts: z.number(),
    kid: BufferHexSchema,
    sig: BufferHexSchema
});
