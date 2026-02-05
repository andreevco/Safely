import { IEnumerableStorage, ITreeStorage } from '../di/I-storage';

export class TreeStorage implements ITreeStorage {
    public static root(storage: IEnumerableStorage) {
        return new TreeStorage([], storage);
    }

    constructor(
        public path: string[],
        private readonly storage: IEnumerableStorage,
        public parent: TreeStorage | null = null
    ) {}

    private readonly separator = '..';

    private dataKey(key?: string): string {
        const path = key === undefined ? this.path : [...this.path, key];
        return `_data${this.separator}${this.pathToString(path)}`;
    }

    private get clearIntentKey(): string {
        return `_intent${this.separator}clear${this.separator}${this.pathToString(this.path)}`;
    }

    private pathToString(path: string[]): string {
        return path.map(i => i.replaceAll(this.separator, '_')).join(this.separator);
    }

    public async setItem(key: string, value: string): Promise<void> {
        await this.recoverIntents();

        const fullKey = this.dataKey(key);
        return this.storage.setItem(fullKey, value);
    }

    public async getItem(key: string): Promise<string | null> {
        await this.recoverIntents();

        const fullKey = this.dataKey(key);
        return this.storage.getItem(fullKey);
    }

    public async removeItem(key: string): Promise<void> {
        await this.recoverIntents();

        const fullKey = this.dataKey(key);
        return this.storage.removeItem(fullKey);
    }

    public async clear(): Promise<void> {
        await this.storage.setItem(this.clearIntentKey, 'true');

        const actualKeys = await this.getAllKeys();
        for (const key of actualKeys) {
            await this.storage.removeItem(key);
        }

        await this.storage.removeItem(this.clearIntentKey);
    }

    public async getAllKeys(): Promise<string[]> {
        const keys = await this.storage.getAllKeys();
        const prefix = this.dataKey();
        const childPrefix = prefix.endsWith(this.separator) ? prefix : `${prefix}${this.separator}`;
        return keys.filter(k => k.startsWith(childPrefix));
    }

    public child(path: string[] | string): ITreeStorage {
        const segments = Array.isArray(path) ? path : [path];
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        let current: TreeStorage = this;

        for (const segment of segments) {
            current = new TreeStorage([...current.path, segment], this.storage, current);
        }

        return current;
    }

    private async recoverIntents() {
        const clearIntent = await this.storage.getItem(this.clearIntentKey);
        if (clearIntent) {
            return this.clear();
        }
    }
}
