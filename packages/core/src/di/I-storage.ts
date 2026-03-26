export type { IStorage, IEnumerableStorage, ITreeStorage } from '@safely/sync';

export interface ISyncSingleStorage {
    set(value: string): void;
    get(): string | null;
    clear(): void;
}
