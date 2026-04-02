export interface ICRDT<U> {
    get(k: string): string | null;
    set(k: string, v: string): void;
    remove(k: string): void;

    applyUpdate(update: U, origin: string): void;
    encodeAsSnapshot(): U;

    onUpdate(observer: (update: U, origin: string) => void): () => void;
}
