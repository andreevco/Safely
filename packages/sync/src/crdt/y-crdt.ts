import { Draft, JsonValue, ObjectDraft, Storage } from '@safely/slottree';

export class YCRDT<T extends object> {
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

    public set(key: Extract<keyof T, string>, value: unknown): void {
        this.doc.transaction(draft => {
            (draft as ObjectDraft<Record<string, JsonValue | undefined>>).set(
                key,
                value as JsonValue
            );
        });
    }

    public transaction(fn: (draft: Draft<T>) => void): void {
        this.doc.transaction(fn);
    }

    public equals(other: string): boolean {
        return this.doc.export() === other;
    }
}
