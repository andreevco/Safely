import type { Draft, SlotTree } from '@safely/slottree';

export class YCRDT<T extends object> {
    constructor(private readonly doc: SlotTree<T>) {}

    public applyUpdate(update: Buffer): void {
        this.doc.merge(update.toString('utf8'));
    }

    public async unsafeAsyncApplyUpdate(
        update: Buffer,
        commit: (snapshot: Buffer) => Promise<boolean>
    ): Promise<boolean> {
        return await this.doc.unsafeAsyncMerge(update.toString('utf8'), async snapshot => {
            return await commit(Buffer.from(snapshot, 'utf8'));
        });
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

    public addAuthor(authorId: string, storageVersion: number): void {
        this.doc.addAuthor(authorId, storageVersion);
    }

    public deleteAuthor(authorId: string): void {
        this.doc.removeAuthor(authorId);
    }

    public transaction(fn: (draft: Draft<T>) => void): void {
        this.doc.transaction(fn);
    }

    public async unsafeAsyncTransaction(
        fn: (draft: Draft<T>) => void,
        commit: (snapshot: Buffer) => Promise<boolean>
    ): Promise<boolean> {
        return await this.doc.unsafeAsyncTransaction(fn, async snapshot => {
            return await commit(Buffer.from(snapshot, 'utf8'));
        });
    }

    public equals(other: string): boolean {
        return this.doc.export() === other;
    }
}
