import type { ITreeStorage } from '../../src/I-storage';

export class InMemStorage implements ITreeStorage {
    constructor(
        public readonly path: string[] = [],
        public readonly parent: InMemStorage | null = null
    ) {}

    private readonly data: Map<string, string> = new Map();
    private readonly children: Map<string, InMemStorage> = new Map();

    public async getItem(key: string): Promise<string | null> {
        return this.data.get(key) || null;
    }

    public async removeItem(key: string): Promise<void> {
        this.data.delete(key);
    }

    public async setItem(key: string, value: string): Promise<void> {
        this.data.set(key, value);
    }

    public async getAllKeys(): Promise<string[]> {
        return Array.from(this.data.keys());
    }

    public async getOwnKeys(): Promise<string[]> {
        return Array.from(new Set([...this.data.keys(), ...this.children.keys()]));
    }

    public child(path: string[] | string): ITreeStorage {
        if (typeof path === 'string') {
            path = [path];
        }
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        let current: InMemStorage = this;
        for (const segment of path) {
            if (!current.children.has(segment)) {
                const child = new InMemStorage([...current.path, segment], current);
                current.children.set(segment, child);
            }
            current = current.children.get(segment)!;
        }
        return current;
    }

    public async clear(): Promise<void> {
        this.data.clear();
        this.children.clear();
    }
}
