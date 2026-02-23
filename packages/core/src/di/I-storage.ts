export interface IStorage {
    setItem(key: string, value: string): Promise<void>;
    getItem(key: string): Promise<string | null>;
    removeItem(key: string): Promise<void>;
    clear(): Promise<void>;
}

export interface IEnumerableStorage extends IStorage {
    getAllKeys(): Promise<string[]>;
}

export interface ITreeStorage extends IEnumerableStorage {
    child(path: string[] | string): ITreeStorage;
}

export interface ISyncSingleStorage {
    set(value: string): void;
    get(): string | null;
    clear(): void;
}
