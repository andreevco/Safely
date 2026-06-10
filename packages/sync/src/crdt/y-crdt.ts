import type { Draft, SlotRevision, SlotTree } from '@safely/slottree';

export class YCRDT<T extends object> {
    constructor(private readonly doc: SlotTree<T>) {}

    public applyUpdate(update: Buffer): void {
        this.doc.merge(update);
    }

    public async unsafeAsyncApplyUpdate(
        update: Buffer,
        commit: (snapshot: Buffer) => Promise<boolean>
    ): Promise<boolean> {
        return await this.doc.unsafeAsyncMerge(update, commit);
    }

    public encodeAsSnapshot(): Buffer {
        return this.doc.export();
    }

    public getFull(): T {
        return this.doc.get();
    }

    public get(k: string): unknown {
        return (this.doc.get() as Record<string, unknown>)[k];
    }

    public getTopLevelRevision(k: Extract<keyof T, string>): SlotRevision | undefined {
        return this.doc.getTopLevelRevision(k);
    }

    public onUpdate(observer: (update: Buffer) => void): () => void {
        return this.doc.onChange(() => {
            observer(this.encodeAsSnapshot());
        });
    }

    public addAuthor(authorId: Buffer, storageVersion: number): void {
        this.doc.addAuthor(authorId, storageVersion);
    }

    public deleteAuthor(authorId: Buffer): void {
        this.doc.removeAuthor(authorId);
    }

    public transaction(fn: (draft: Draft<T>) => void): void {
        this.doc.transaction(fn);
    }

    public async unsafeAsyncTransaction(
        fn: (draft: Draft<T>) => void,
        commit: (snapshot: Buffer) => Promise<boolean>
    ): Promise<boolean> {
        return await this.doc.unsafeAsyncTransaction(fn, commit);
    }

    public equals(other: Buffer): boolean {
        return this.doc.export().equals(other);
    }
}
