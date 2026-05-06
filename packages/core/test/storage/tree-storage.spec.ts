import { describe, expect, it, vi } from 'vitest';

import { InMemoryEnumerableStorage } from './mocks';
import { TreeStorage } from '../../src';
import {
    decodeTreeStoragePathSegment,
    encodeTreeStoragePathSegment
} from '../../src/storage/tree-storage';

describe('TreeStorage', () => {
    it('writes and reads values under composed path', async () => {
        const base = new InMemoryEnumerableStorage();
        const root = TreeStorage.root(base);
        const user = root.child(['users', '123']);

        await user.setItem('token', 'abc');
        expect(await user.getItem('token')).toBe('abc');

        // internal key should include prefix for the path
        const all = await base.getAllKeys();
        expect(all.some(k => k.startsWith('users..123') && k.endsWith('..token'))).toBe(true);
    });

    it('produces distinct keys for path segments that would collide under naive escaping', async () => {
        const base = new InMemoryEnumerableStorage();
        const root = TreeStorage.root(base);
        const dotted = root.child('a..b');
        const underscored = root.child('a_b');

        await dotted.setItem('x', '1');
        await underscored.setItem('x', '2');

        expect(await dotted.getItem('x')).toBe('1');
        expect(await underscored.getItem('x')).toBe('2');

        const dataKeys = await base.getAllKeys();
        expect(dataKeys.length).toBe(2);
        expect(new Set(dataKeys).size).toBe(2);
    });

    it('escape character itself does not collide across segments', async () => {
        const base = new InMemoryEnumerableStorage();
        const root = TreeStorage.root(base);
        // `_d` is the encoded form of `.` — putting it literally in a segment must
        // not alias a segment that actually contains `.` after encoding.
        const dotted = root.child('a.b');
        const literalEscape = root.child('a_db');

        await dotted.setItem('x', '1');
        await literalEscape.setItem('x', '2');

        expect(await dotted.getItem('x')).toBe('1');
        expect(await literalEscape.getItem('x')).toBe('2');
    });

    it('round-trips segments containing literal _u and _d sequences', async () => {
        // `_u`/`_d` are the encoded forms of `_`/`.` — a user-provided string
        // that already contains those byte pairs must not be misinterpreted by
        // the decoder. Encoding escapes every `_` first, so no bare `_` survives
        // and the regex always pairs `_` with the following `u`/`d`.
        const base = new InMemoryEnumerableStorage();
        const root = TreeStorage.root(base);
        const node = root.child(['scope']);

        await node.setItem('a_ub_dc', '1');
        await node.setItem('_u', '2');
        await node.setItem('_d', '3');
        await node.setItem('._d', '4');

        expect(await node.getItem('a_ub_dc')).toBe('1');
        expect(await node.getItem('_u')).toBe('2');
        expect(await node.getItem('_d')).toBe('3');
        expect(await node.getItem('._d')).toBe('4');

        const keys = await node.getOwnKeys();
        expect(keys.sort()).toEqual(['._d', '_d', '_u', 'a_ub_dc'].sort());
    });

    it('clear removes only keys under current path prefix', async () => {
        const base = new InMemoryEnumerableStorage();
        const root = TreeStorage.root(base);
        const p1 = root.child(['a', 'b']);
        const p2 = root.child(['a', 'c']);

        await p1.setItem('k1', 'v1');
        await p2.setItem('k2', 'v2');
        expect((await base.getAllKeys()).length).toBe(2);

        await p1.clear();
        const keys = await base.getAllKeys();
        expect(keys.length).toBe(1);
        expect(keys.some(k => k.includes('a..c'))).toBe(true);
    });

    it('root clear removes everything stored through any descendant', async () => {
        const base = new InMemoryEnumerableStorage();
        const root = TreeStorage.root(base);

        await root.setItem('top', 'v0');
        await root.child('a').setItem('k1', 'v1');
        await root.child(['nested', 'deep']).setItem('k2', 'v2');
        expect((await base.getAllKeys()).length).toBe(3);

        await root.clear();

        expect(await base.getAllKeys()).toEqual([]);
    });

    it('child clear only removes keys under that subtree', async () => {
        const base = new InMemoryEnumerableStorage();
        const removePrefixSpy = vi.spyOn(base, 'removeItemsWithPrefix');
        const root = TreeStorage.root(base);
        const child = root.child(['scope']);

        await child.setItem('k', 'v');
        await root.child('other').setItem('keep', 'v');
        await child.clear();

        expect(removePrefixSpy).toHaveBeenCalledWith('scope..');
        const keys = await base.getAllKeys();
        expect(keys.some(k => k.startsWith('other..'))).toBe(true);
        expect(keys.some(k => k.startsWith('scope..'))).toBe(false);
    });

    it('clear does not remove keys from overlapping path names', async () => {
        const base = new InMemoryEnumerableStorage();
        const root = TreeStorage.root(base);
        const sync = root.child(['root', 'sync']);
        const syncProvider = root.child(['root', 'sync-provider']);

        await sync.setItem('k1', 'v1');
        await syncProvider.setItem('k2', 'v2');

        await sync.clear();

        const keys = await base.getAllKeys();
        expect(keys.every(k => !k.startsWith('root..sync..'))).toBe(true);
        expect(keys.some(k => k.startsWith('root..sync-provider..'))).toBe(true);
    });

    it('getOwnKeys returns only direct child keys at this node, decoded', async () => {
        const base = new InMemoryEnumerableStorage();
        const root = TreeStorage.root(base);
        const node = root.child(['scope']);

        await node.setItem('a', '1');
        await node.setItem('b..c', '2'); // user-facing key with separator chars
        await node.child('nested').setItem('deep', '3'); // descendant — must not appear

        const keys = await node.getOwnKeys();
        expect(keys.sort()).toEqual(['a', 'b..c']);

        // Sanity: the key with separator chars round-trips.
        expect(await node.getItem('b..c')).toBe('2');
    });

    it('child() rejects path segments outside [A-Za-z0-9._-] eagerly', () => {
        const base = new InMemoryEnumerableStorage();
        const root = TreeStorage.root(base);
        const invalid = [
            'привет',
            '🙂',
            'a:b',
            'a/b',
            'a b',
            'a+b',
            'a%b',
            'https://example.com',
            'a\nb',
            'a\\b'
        ];
        for (const seg of invalid) {
            expect(() => root.child(seg)).toThrow(/outside \[A-Za-z0-9\._-]/);
            expect(() => root.child(['ok', seg])).toThrow(/outside \[A-Za-z0-9\._-]/);
        }
    });

    it('child() rejects empty path segments eagerly', () => {
        const base = new InMemoryEnumerableStorage();
        const root = TreeStorage.root(base);
        expect(() => root.child('')).toThrow(/empty/);
        expect(() => root.child(['ok', ''])).toThrow(/empty/);
        expect(() => root.child([])).toThrow(/empty/);
    });

    it('TreeStorage constructor rejects invalid path segments', () => {
        const base = new InMemoryEnumerableStorage();
        expect(() => new TreeStorage(['valid', 'a:b'], base)).toThrow(/outside/);
        expect(() => new TreeStorage([''], base)).toThrow(/empty/);
    });

    it('setItem / getItem / removeItem reject keys outside [A-Za-z0-9._-]', () => {
        const base = new InMemoryEnumerableStorage();
        const root = TreeStorage.root(base);
        expect(() => root.setItem('a:b', 'v')).toThrow(/outside/);
        expect(() => root.getItem('a/b')).toThrow(/outside/);
        expect(() => root.removeItem('a b')).toThrow(/outside/);
        expect(() => root.setItem('', 'v')).toThrow(/empty/);
    });
});

describe('IEnumerableStorage contract: removeItemsWithPrefix("") ≡ clear()', () => {
    it('empty prefix removes every key, like clear()', async () => {
        const a = new InMemoryEnumerableStorage();
        const b = new InMemoryEnumerableStorage();

        for (const s of [a, b]) {
            await s.setItem('alpha', '1');
            await s.setItem('beta..gamma', '2');
            await s.setItem('zeta', '3');
        }

        await a.clear();
        await b.removeItemsWithPrefix('');

        expect(await a.getAllKeys()).toEqual([]);
        expect(await b.getAllKeys()).toEqual([]);
    });

    it('empty prefix on an empty storage is a no-op', async () => {
        const s = new InMemoryEnumerableStorage();
        await expect(s.removeItemsWithPrefix('')).resolves.toBeUndefined();
        expect(await s.getAllKeys()).toEqual([]);
    });
});

describe('encodeTreeStoragePathSegment / decodeTreeStoragePathSegment bijectivity', () => {
    const cases: [name: string, value: string][] = [
        ['empty', ''],
        ['plain ascii', 'hello'],
        ['single underscore', '_'],
        ['single dot', '.'],
        ['encoded form _u literally', '_u'],
        ['encoded form _d literally', '_d'],
        ['mixed _u and _d', 'a_ub_dc'],
        ['dot then encoded form', '._d'],
        ['underscore then encoded form', '__d'],
        ['multiple dots', '...'],
        ['multiple underscores', '___'],
        ['separator-like substring', '..'],
        ['adjacent escape pairs', '_u_d_u_d'],
        ['only special chars', '_._._.'],
        ['trailing underscore', 'foo_'],
        ['leading dot', '.bar'],
        ['hyphens and digits', 'AZ-09']
    ];

    it.each(cases)('round-trips: %s', (_name, value) => {
        expect(decodeTreeStoragePathSegment(encodeTreeStoragePathSegment(value))).toBe(value);
    });

    it('keeps output within SecureStore-safe alphabet for inputs from [A-Za-z0-9._-]', () => {
        const safe = /^[A-Za-z0-9._-]*$/;
        const inputs = ['abc', 'a.b', 'a_b', '...', '___', '_u_d', 'AZ-09'];
        for (const input of inputs) {
            expect(safe.test(encodeTreeStoragePathSegment(input))).toBe(true);
        }
    });

    it('encoded output contains no bare "." (so SEPARATOR ".." is unambiguous)', () => {
        const inputs = ['a.b', '...', '.', 'a..b', 'no-dots-here', '_d_d'];
        for (const input of inputs) {
            expect(encodeTreeStoragePathSegment(input).includes('.')).toBe(false);
        }
    });

    it('distinct inputs produce distinct outputs (injectivity on tricky pairs)', () => {
        const pairs: [string, string][] = [
            ['_', '.'],
            ['_u', '_'],
            ['_d', '.'],
            ['a..b', 'a_db'],
            ['a.b', 'a_db'],
            ['_u_d', '_.']
        ];
        for (const [a, b] of pairs) {
            expect(encodeTreeStoragePathSegment(a)).not.toBe(encodeTreeStoragePathSegment(b));
        }
    });
});
