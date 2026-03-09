import * as Y from 'yjs';

import { ICRDT } from './I-crdt';

export class YCRDT implements ICRDT<Buffer> {
    constructor(private readonly doc: Y.Doc) {}

    public applyUpdate(update: Buffer, origin: string): void {
        Y.applyUpdateV2(this.doc, update, origin);
    }

    public encodeAsSnapshot(): Buffer {
        return Buffer.from(Y.encodeStateAsUpdateV2(this.doc));
    }

    public get(k: string): string | null {
        const map = this.doc.getMap<string>('root');
        return map.get(k) ?? null;
    }

    public getArray(k: string): Y.Array<string> {
        return this.doc.getArray(k);
    }

    public onUpdate(observer: (update: Buffer, origin: string) => void): () => void {
        const handler = (update: Uint8Array, origin: unknown) => {
            observer(Buffer.from(update), typeof origin === 'string' ? origin : 'local');
        };
        this.doc.on('updateV2', handler);

        return () => {
            this.doc.off('updateV2', handler);
        };
    }

    public remove(k: string): void {
        const map = this.doc.getMap<string>('root');
        map.delete(k);
    }

    public set(k: string, v: string): void {
        const map = this.doc.getMap<string>('root');
        map.set(k, v);
    }

    public equals(other: YCRDT): boolean {
        const thisState = Y.encodeStateVector(this.doc);
        const otherState = Y.encodeStateVector(other.doc);
        return Buffer.from(thisState).equals(Buffer.from(otherState));
    }

    public toRaw(): Y.Doc {
        return this.doc;
    }
}
