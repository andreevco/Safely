import { describe, expect, it, vi } from 'vitest';

import { InMemoryStorage } from './mocks';
import { EnumerableStorage } from '../../src';

const INTENT_KEY = '_intent..enumerable';
const INDEX_KEY = '_index..keys';

describe('EnumerableStorage', () => {
    it('adds and lists keys via index', async () => {
        const data = new InMemoryStorage();
        const meta = new InMemoryStorage();
        const storage = new EnumerableStorage(data, meta);

        await storage.setItem('a', '1');
        await storage.setItem('b', '2');

        expect(await storage.getItem('a')).toBe('1');
        expect(await storage.getItem('b')).toBe('2');
        expect(await storage.getAllKeys()).toEqual(['a', 'b']); // sorted by saveIndex
    });

    it('removes keys and updates index', async () => {
        const data = new InMemoryStorage();
        const meta = new InMemoryStorage();
        const storage = new EnumerableStorage(data, meta);

        await storage.setItem('a', '1');
        await storage.setItem('b', '2');
        await storage.removeItem('a');

        expect(await storage.getItem('a')).toBeNull();
        expect(await storage.getAllKeys()).toEqual(['b']);
    });

    it('clear removes all keys when dataStorage has clear()', async () => {
        const data = new InMemoryStorage();
        const meta = new InMemoryStorage();
        const storage = new EnumerableStorage(data, meta);

        await storage.setItem('x', '1');
        await storage.setItem('y', '2');
        await storage.clear();

        expect(await storage.getAllKeys()).toEqual([]);
        expect(data.map.size).toBe(0);
    });

    it('clear removes all keys when dataStorage has no clear()', async () => {
        // Build a data storage without a clear method to hit the fallback branch
        const backing = new InMemoryStorage();
        const dataNoClear = {
            setItem: backing.setItem.bind(backing),
            getItem: backing.getItem.bind(backing),
            removeItem: backing.removeItem.bind(backing)
            // intentionally no clear()
        };
        const meta = new InMemoryStorage();
        const storage = new EnumerableStorage(dataNoClear, meta);

        await storage.setItem('x', '1');
        await storage.setItem('y', '2');
        await storage.clear();

        expect(await storage.getAllKeys()).toEqual([]);
        expect(backing.map.size).toBe(0);
    });

    it('recovers pending SET intent by adding key to index if value exists', async () => {
        const data = new InMemoryStorage();
        const meta = new InMemoryStorage();
        const storage = new EnumerableStorage(data, meta);

        // Simulate crash after writing value, before index update
        await data.setItem('a', '1');
        await meta.setItem('_intent..enumerable', JSON.stringify({ op: 'set', key: 'a' }));

        expect(await storage.getAllKeys()).toEqual(['a']);
        expect(await meta.getItem('_intent..enumerable')).toBeNull();
    });

    it('recovers pending REMOVE intent by removing value and index entry', async () => {
        const data = new InMemoryStorage();
        const meta = new InMemoryStorage();
        const storage = new EnumerableStorage(data, meta);

        await storage.setItem('a', '1'); // establishes index
        await meta.setItem('_intent..enumerable', JSON.stringify({ op: 'remove', key: 'a' }));

        // Trigger recovery
        expect(await storage.getAllKeys()).toEqual([]);
        expect(await data.getItem('a')).toBeNull();
        expect(await meta.getItem('_intent..enumerable')).toBeNull();
    });

    it('recovers pending CLEAR intent by clearing all and resetting index', async () => {
        const data = new InMemoryStorage();
        const meta = new InMemoryStorage();
        const storage = new EnumerableStorage(data, meta);

        await storage.setItem('a', '1');
        await storage.setItem('b', '2');
        await meta.setItem('_intent..enumerable', JSON.stringify({ op: 'clear' }));

        // Trigger recovery
        expect(await storage.getAllKeys()).toEqual([]);
        expect(data.map.size).toBe(0);
        expect(await meta.getItem('_intent..enumerable')).toBeNull();
    });

    it('ignores malformed intent and clears it', async () => {
        const data = new InMemoryStorage();
        const meta = new InMemoryStorage();
        const storage = new EnumerableStorage(data, meta);

        await storage.setItem('a', '1');
        await meta.setItem(INTENT_KEY, '{not-json');

        expect(await storage.getAllKeys()).toEqual(['a']);
        expect(await meta.getItem(INTENT_KEY)).toBeNull();
    });

    // === Concurrency (Bugs 1–3): serialization queue ===

    it('serializes concurrent setItems so all keys land in index', async () => {
        const data = new InMemoryStorage();
        const meta = new InMemoryStorage();
        const storage = new EnumerableStorage(data, meta);

        const N = 50;
        const ops = Array.from({ length: N }, (_, i) => storage.setItem(`k${i}`, `v${i}`));
        await Promise.all(ops);

        const keys = await storage.getAllKeys();
        expect(keys).toHaveLength(N);
        for (let i = 0; i < N; i++) {
            expect(keys).toContain(`k${i}`);
            expect(await storage.getItem(`k${i}`)).toBe(`v${i}`);
        }
    });

    it('serializes concurrent mixed ops in submission order', async () => {
        const data = new InMemoryStorage();
        const meta = new InMemoryStorage();
        const storage = new EnumerableStorage(data, meta);

        await storage.setItem('a', '0');

        await Promise.all([
            storage.setItem('b', '1'),
            storage.removeItem('a'),
            storage.setItem('c', '2'),
            storage.setItem('a', 'reborn')
        ]);

        // Order: set b → remove a → set c → set a('reborn'). Final state preserves all.
        expect(await storage.getItem('a')).toBe('reborn');
        expect(await storage.getItem('b')).toBe('1');
        expect(await storage.getItem('c')).toBe('2');
        expect(await storage.getAllKeys()).toEqual(['a', 'b', 'c']);
    });

    it('intent slot is never overwritten by a concurrent in-flight op', async () => {
        const data = new InMemoryStorage();
        const meta = new InMemoryStorage();
        const storage = new EnumerableStorage(data, meta);

        // Capture intent at the moment each dataStorage.setItem runs
        const intentSnapshots: (string | null)[] = [];
        const originalSet = data.setItem.bind(data);
        vi.spyOn(data, 'setItem').mockImplementation(async (k: string, v: string) => {
            intentSnapshots.push(await meta.getItem(INTENT_KEY));
            await originalSet(k, v);
        });

        await Promise.all([
            storage.setItem('a', '1'),
            storage.setItem('b', '2'),
            storage.setItem('c', '3')
        ]);

        // Each op observed its OWN intent — without serialization the second op's
        // setIntent would have overwritten the first before its data write fired.
        expect(intentSnapshots).toEqual([
            JSON.stringify({ op: 'set', key: 'a' }),
            JSON.stringify({ op: 'set', key: 'b' }),
            JSON.stringify({ op: 'set', key: 'c' })
        ]);
    });

    // === Bug 4: transient runtime errors during recovery preserve intent ===

    it('preserves intent if SET recovery throws on dataStorage.getItem', async () => {
        const data = new InMemoryStorage();
        const meta = new InMemoryStorage();
        const storage = new EnumerableStorage(data, meta);

        await data.setItem('a', '1');
        const intent = JSON.stringify({ op: 'set', key: 'a' });
        await meta.setItem(INTENT_KEY, intent);

        vi.spyOn(data, 'getItem').mockRejectedValueOnce(new Error('transient I/O'));

        await expect(storage.getAllKeys()).rejects.toThrow('transient I/O');

        // Intent must still be present so a future op can retry recovery
        expect(await meta.getItem(INTENT_KEY)).toBe(intent);

        // Retry without flakiness — recovery completes
        expect(await storage.getAllKeys()).toEqual(['a']);
        expect(await meta.getItem(INTENT_KEY)).toBeNull();
    });

    it('preserves intent if REMOVE recovery throws on dataStorage.removeItem', async () => {
        const data = new InMemoryStorage();
        const meta = new InMemoryStorage();
        const storage = new EnumerableStorage(data, meta);

        await storage.setItem('a', '1');
        const intent = JSON.stringify({ op: 'remove', key: 'a' });
        await meta.setItem(INTENT_KEY, intent);

        vi.spyOn(data, 'removeItem').mockRejectedValueOnce(new Error('transient I/O'));

        await expect(storage.getAllKeys()).rejects.toThrow('transient I/O');
        expect(await meta.getItem(INTENT_KEY)).toBe(intent);

        // Retry recovers
        expect(await storage.getAllKeys()).toEqual([]);
        expect(await data.getItem('a')).toBeNull();
    });

    it('drops intent that fails schema validation but preserves it on runtime errors', async () => {
        const data = new InMemoryStorage();
        const meta = new InMemoryStorage();
        const storage = new EnumerableStorage(data, meta);

        await storage.setItem('a', '1');
        await meta.setItem(INTENT_KEY, JSON.stringify({ op: 'INVALID_OP' }));

        // Invalid op fails sIntent schema → dropped
        expect(await storage.getAllKeys()).toEqual(['a']);
        expect(await meta.getItem(INTENT_KEY)).toBeNull();
    });

    // === Bug 5: corrupt index throws instead of silently emptying ===

    it('throws when index JSON is malformed', async () => {
        const data = new InMemoryStorage();
        const meta = new InMemoryStorage();
        const storage = new EnumerableStorage(data, meta);

        await meta.setItem(INDEX_KEY, '{not-json');

        await expect(storage.getAllKeys()).rejects.toThrow(/not valid JSON/);
    });

    it('throws when index fails schema validation', async () => {
        const data = new InMemoryStorage();
        const meta = new InMemoryStorage();
        const storage = new EnumerableStorage(data, meta);

        await meta.setItem(INDEX_KEY, JSON.stringify({ wrong: 'shape' }));

        await expect(storage.getAllKeys()).rejects.toThrow(/schema validation/);
    });

    it('setItem rejects when index is corrupt (addKeyToIndex reads it)', async () => {
        const data = new InMemoryStorage();
        const meta = new InMemoryStorage();
        const storage = new EnumerableStorage(data, meta);

        await meta.setItem(INDEX_KEY, '<<garbage>>');

        await expect(storage.setItem('a', '1')).rejects.toThrow(/not valid JSON/);
    });

    // === Bug 8: clear without native clear() writes index only once ===

    it('clear on no-clear dataStorage writes index exactly once', async () => {
        const backing = new InMemoryStorage();
        const dataNoClear = {
            setItem: backing.setItem.bind(backing),
            getItem: backing.getItem.bind(backing),
            removeItem: backing.removeItem.bind(backing)
        };
        const meta = new InMemoryStorage();
        const storage = new EnumerableStorage(dataNoClear, meta);

        for (let i = 0; i < 20; i++) {
            await storage.setItem(`k${i}`, String(i));
        }

        // Spy starts AFTER seed phase so we measure clear() only
        const setItemSpy = vi.spyOn(meta, 'setItem');
        await storage.clear();

        const indexWrites = setItemSpy.mock.calls.filter(([k]) => k === INDEX_KEY);
        // Pre-fix would have been 20+ (one per removed key + final reset). Post-fix: 1.
        expect(indexWrites).toHaveLength(1);
        expect(backing.map.size).toBe(0);
        expect(await storage.getAllKeys()).toEqual([]);
    });

    // === Behavior cases not previously covered ===

    it('overwriting same key does not duplicate the index entry', async () => {
        const data = new InMemoryStorage();
        const meta = new InMemoryStorage();
        const storage = new EnumerableStorage(data, meta);

        await storage.setItem('a', '1');
        await storage.setItem('a', '2');
        await storage.setItem('a', '3');

        expect(await storage.getItem('a')).toBe('3');
        expect(await storage.getAllKeys()).toEqual(['a']);
    });

    it('removeItem of non-existent key is a no-op', async () => {
        const data = new InMemoryStorage();
        const meta = new InMemoryStorage();
        const storage = new EnumerableStorage(data, meta);

        await storage.setItem('a', '1');
        await storage.removeItem('ghost');

        expect(await storage.getItem('a')).toBe('1');
        expect(await storage.getAllKeys()).toEqual(['a']);
    });

    it('SET recovery skips key when data was never written', async () => {
        const data = new InMemoryStorage();
        const meta = new InMemoryStorage();
        const storage = new EnumerableStorage(data, meta);

        // Crash happened before dataStorage.setItem ran — data is empty
        await meta.setItem(INTENT_KEY, JSON.stringify({ op: 'set', key: 'never_written' }));

        // Recovery sees null in data → must NOT add ghost key to index
        expect(await storage.getAllKeys()).toEqual([]);
        expect(await meta.getItem(INTENT_KEY)).toBeNull();
    });

    it('handles empty string keys', async () => {
        const data = new InMemoryStorage();
        const meta = new InMemoryStorage();
        const storage = new EnumerableStorage(data, meta);

        await storage.setItem('', 'value');

        expect(await storage.getItem('')).toBe('value');
        expect(await storage.getAllKeys()).toEqual(['']);
    });

    it('handles empty string values without confusing them with missing keys', async () => {
        const data = new InMemoryStorage();
        const meta = new InMemoryStorage();
        const storage = new EnumerableStorage(data, meta);

        await storage.setItem('a', '');

        expect(await storage.getItem('a')).toBe('');
        expect(await storage.getAllKeys()).toEqual(['a']);
    });

    it('clear on empty storage is safe', async () => {
        const data = new InMemoryStorage();
        const meta = new InMemoryStorage();
        const storage = new EnumerableStorage(data, meta);

        await storage.clear();

        expect(await storage.getAllKeys()).toEqual([]);
        expect(await meta.getItem(INTENT_KEY)).toBeNull();
    });

    it('getAllKeys returns sorted, deduplicated order', async () => {
        const data = new InMemoryStorage();
        const meta = new InMemoryStorage();
        const storage = new EnumerableStorage(data, meta);

        await storage.setItem('zeta', '1');
        await storage.setItem('alpha', '2');
        await storage.setItem('mu', '3');
        await storage.setItem('alpha', '4');

        expect(await storage.getAllKeys()).toEqual(['alpha', 'mu', 'zeta']);
    });
});
