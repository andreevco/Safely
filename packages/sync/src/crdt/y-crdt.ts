import { Storage } from '@safely/slottree';

export class YCRDT<T> {
    constructor(private readonly doc: Storage<T>) {}

    public applyUpdate(update: Buffer): void {
        this.doc.merge(update.toString('utf8'));
    }

    public encodeAsSnapshot(): Buffer {
        return Buffer.from(this.doc.export(), 'utf8');
    }

    public getFull(): T {
        return this.doc.get();
    }

    public get(k: string): unknown {
        return (this.doc.get() as Record<string, unknown>)[k];
    }

    public onUpdate(observer: (update: Buffer) => void): () => void {
        return this.doc.onChange(() => {
            observer(this.encodeAsSnapshot());
        });
    }

    public set(key: string, value: unknown): void {
        this.doc.update(draft => {
            (draft as Record<string, unknown>)[key] = value;
        });
    }

    public update(fn: (v: T) => void) {
        this.doc.update(draft => {
            fn(draft as T);
        });
    }

    public equals(other: string): boolean {
        return this.doc.export() === other;
    }
}
