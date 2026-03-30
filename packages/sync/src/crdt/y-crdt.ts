import * as Y from 'yjs';
import { ZodType } from 'zod';

import { deepMerge } from './deep-merge/deep-merge';
import { yValueToJs } from './deep-merge/y-value-to-js';

export class YCRDT {
    constructor(
        private readonly doc: Y.Doc,
        public readonly schema: Record<string, ZodType>
    ) {}

    public applyUpdate(update: Buffer, origin: string): void {
        Y.applyUpdateV2(this.doc, update, origin);
    }

    public encodeAsSnapshot(): Buffer {
        return Buffer.from(Y.encodeStateAsUpdateV2(this.doc));
    }

    public get(k: string): unknown {
        const map = this.doc.getMap('root');
        const value = map.get(k);
        return value ? yValueToJs(value, this.schema[k]) : null;
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

    public set(k: string, v: unknown): void {
        this.doc.transact(() => {
            deepMerge(this.doc.getMap('root'), k, v, this.schema[k]);
        });
    }

    public equals(other: YCRDT): boolean {
        const thisSnapshot = Buffer.from(Y.encodeStateAsUpdateV2(this.doc));
        const otherSnapshot = Buffer.from(Y.encodeStateAsUpdateV2(other.doc));
        return thisSnapshot.equals(otherSnapshot);
    }

    public toRaw(): Y.Doc {
        return this.doc;
    }
}
