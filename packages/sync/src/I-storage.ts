export interface IStorage {
    setItem(key: string, value: string): Promise<void>;
    getItem(key: string): Promise<string | null>;
    removeItem(key: string): Promise<void>;
    clear(): Promise<void>;
}

export interface IEnumerableStorage extends IStorage {
    getAllKeys(): Promise<string[]>;
    getKeysWithPrefix(prefix: string): Promise<string[]>;
    removeItemsWithPrefix(prefix: string): Promise<void>;
}

export interface ITreeStorage extends IStorage {
    /** Direct-child JS-keys at this node (no cascade into descendants), decoded. */
    getOwnKeys(): Promise<string[]>;
    child(path: string[] | string): ITreeStorage;

    /** Deletes all children (including nested) records  */
    clear(): Promise<void>;
}
