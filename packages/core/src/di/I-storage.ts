export type { IStorage, IEnumerableStorage, ITreeStorage } from '@safely/sync';

export interface ISyncSingleStorage {
    set(value: string): void;
    get(): string | null;
    clear(): void;
}

export interface ISyncKeyValueStorage {
    get(key: string): string | null;
    set(key: string, value: string): void;
    remove(key: string): void;
    clear(): void;
}
