import { z } from 'zod';

import { IEnumerableStorage, IStorage } from '@safely/sync';

import { OptionalProperty } from '../utils';

const sIntent = z.union([
    z.object({ op: z.literal('set'), key: z.string() }),
    z.object({ op: z.literal('remove'), key: z.string() }),
    z.object({ op: z.literal('clear') })
]);
type SIntent = z.infer<typeof sIntent>;

const sIndex = z.array(z.string());

export class EnumerableStorage implements IEnumerableStorage {
    constructor(
        private readonly dataStorage: OptionalProperty<IStorage, 'clear'>,
        private readonly metaStorage: IStorage
    ) {}

    private readonly indexKey = '_index..keys';
    private readonly intentKey = '_intent..enumerable';

    private queue: Promise<unknown> = Promise.resolve();

    private task<T>(fn: () => Promise<T>): Promise<T> {
        const result = this.queue.then(fn);
        this.queue = result.catch(() => undefined);
        return result;
    }

    public setItem(key: string, value: string): Promise<void> {
        return this.task(async () => {
            await this.applyPendingIntent();

            await this.setIntent({ op: 'set', key });
            await this.dataStorage.setItem(key, value);
            await this.addKeyToIndex(key);
            await this.clearIntent();
        });
    }

    public getItem(key: string): Promise<string | null> {
        return this.task(async () => {
            await this.applyPendingIntent();
            return this.dataStorage.getItem(key);
        });
    }

    public removeItem(key: string): Promise<void> {
        return this.task(async () => {
            await this.applyPendingIntent();

            await this.setIntent({ op: 'remove', key });
            await this._removeItem(key);
            await this.clearIntent();
        });
    }

    private async _removeItem(key: string): Promise<void> {
        await this.dataStorage.removeItem(key);
        await this.removeKeyFromIndex(key);
    }

    public clear(): Promise<void> {
        return this.task(async () => {
            await this.applyPendingIntent();

            await this.setIntent({ op: 'clear' });
            await this._clear();
            await this.clearIntent();
        });
    }

    private async _clear() {
        if ('clear' in this.dataStorage && typeof this.dataStorage.clear === 'function') {
            await this.dataStorage.clear();
        } else {
            const keys = await this._getAllKeys();
            for (const key of keys) {
                await this.dataStorage.removeItem(key);
            }
        }
        await this.saveIndex(new Set());
    }

    public getAllKeys(): Promise<string[]> {
        return this.task(async () => {
            await this.applyPendingIntent();
            return this._getAllKeys();
        });
    }

    private async _getAllKeys(): Promise<string[]> {
        const index = await this.getIndex();
        return Array.from(index);
    }

    private async applyPendingIntent(): Promise<void> {
        const intentRaw = await this.metaStorage.getItem(this.intentKey);
        if (!intentRaw) {
            return;
        }

        let intent: SIntent;
        try {
            const parsed = sIntent.safeParse(JSON.parse(intentRaw));
            if (!parsed.success) {
                console.error('EnumerableStorage: corrupt intent, dropping', parsed.error);
                await this.clearIntent();
                return;
            }
            intent = parsed.data;
        } catch (e) {
            console.error('EnumerableStorage: malformed intent JSON, dropping', e);
            await this.clearIntent();
            return;
        }

        if (intent.op === 'set') {
            const value = await this.dataStorage.getItem(intent.key);
            if (value !== null) {
                await this.addKeyToIndex(intent.key);
            }
        } else if (intent.op === 'remove') {
            await this._removeItem(intent.key);
        } else if (intent.op === 'clear') {
            await this._clear();
        }

        await this.clearIntent();
    }

    private async setIntent(intent: SIntent): Promise<void> {
        await this.metaStorage.setItem(this.intentKey, JSON.stringify(intent));
    }

    private async clearIntent(): Promise<void> {
        await this.metaStorage.removeItem(this.intentKey);
    }

    private async getIndex(): Promise<Set<string>> {
        const raw = await this.metaStorage.getItem(this.indexKey);
        if (!raw) return new Set<string>();

        let parsedJson: unknown;
        try {
            parsedJson = JSON.parse(raw);
        } catch (e) {
            throw new Error(
                `EnumerableStorage: index is not valid JSON — refusing to proceed to avoid masking data loss. Underlying error: ${(e as Error).message}`
            );
        }

        const parsed = sIndex.safeParse(parsedJson);
        if (!parsed.success) {
            throw new Error(
                `EnumerableStorage: index failed schema validation — refusing to proceed to avoid masking data loss. ${parsed.error.message}`
            );
        }

        return new Set(parsed.data);
    }

    private async saveIndex(index: Set<string>): Promise<void> {
        const arr = Array.from(index);
        arr.sort();
        const validated = sIndex.parse(arr);
        await this.metaStorage.setItem(this.indexKey, JSON.stringify(validated));
    }

    private async addKeyToIndex(key: string): Promise<void> {
        const index = await this.getIndex();
        if (!index.has(key)) {
            index.add(key);
            await this.saveIndex(index);
        }
    }

    private async removeKeyFromIndex(key: string): Promise<void> {
        const index = await this.getIndex();
        if (index.delete(key)) {
            await this.saveIndex(index);
        }
    }
}
