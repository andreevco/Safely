import { IEnumerableStorage, ITreeStorage } from '../di';

const SEPARATOR = '..';

const ALLOWED_SEGMENT_CHARS = /^[A-Za-z0-9._-]+$/;

export function encodeTreeStoragePathSegment(segment: string): string {
    // `_` is the escape char. Each `_` becomes `_u`, each `.` becomes `_d`.
    // After encoding a segment never contains a bare `.`, so `..` is an
    // unambiguous delimiter and the encoding is bijective. The encoded
    // alphabet stays within `[A-Za-z0-9._-]`, which SecureStore accepts —
    // input alphabet is enforced eagerly by `validateKey` at every
    // TreeStorage entry point, so this function assumes valid input.
    let out = '';
    for (const ch of segment) {
        if (ch === '_') out += '_u';
        else if (ch === '.') out += '_d';
        else out += ch;
    }
    return out;
}

export function decodeTreeStoragePathSegment(encoded: string): string {
    return encoded.replace(/_([ud])/g, (_match, ch: string) => (ch === 'u' ? '_' : '.'));
}

export class TreeStorage implements ITreeStorage {
    public static root(storage: IEnumerableStorage) {
        return new TreeStorage([], storage);
    }

    private readonly separator = SEPARATOR;

    constructor(
        public path: string[],
        private readonly storage: IEnumerableStorage
    ) {
        for (const segment of path) {
            this.validateKey(segment);
        }
    }

    private keyPath(key: string): string {
        const path = [...this.path, key];
        return this.pathToString(path);
    }

    private pathToString(path: string[]): string {
        return path.map(encodeTreeStoragePathSegment).join(this.separator);
    }

    private childKeyPrefix(): string {
        const prefix = this.pathToString(this.path);
        return prefix.length === 0 ? '' : `${prefix}${this.separator}`;
    }

    public setItem(key: string, value: string): Promise<void> {
        this.validateKey(key);
        return this.storage.setItem(this.keyPath(key), value);
    }

    public getItem(key: string): Promise<string | null> {
        this.validateKey(key);
        return this.storage.getItem(this.keyPath(key));
    }

    public removeItem(key: string): Promise<void> {
        this.validateKey(key);
        return this.storage.removeItem(this.keyPath(key));
    }

    public clear(): Promise<void> {
        return this.storage.removeItemsWithPrefix(this.childKeyPrefix());
    }

    public async getOwnKeys(): Promise<string[]> {
        const childPrefix = this.childKeyPrefix();
        const keys = await this.storage.getKeysWithPrefix(childPrefix);
        return keys
            .map(k => k.slice(childPrefix.length))
            .filter(k => k.length > 0 && !k.includes(this.separator))
            .map(decodeTreeStoragePathSegment);
    }

    public child(path: string[] | string): ITreeStorage {
        const segments = Array.isArray(path) ? path : [path];
        if (!segments.length) {
            throw new Error('Path cannot be empty');
        }
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        let current: TreeStorage = this;
        for (const segment of segments) {
            current = new TreeStorage([...current.path, segment], this.storage);
        }
        return current;
    }

    private validateKey(key: string): void {
        if (key === '') {
            throw new Error('Path segment cannot be empty');
        }
        if (!ALLOWED_SEGMENT_CHARS.test(key)) {
            throw new Error('Path segment contains characters outside [A-Za-z0-9._-]');
        }
    }
}
