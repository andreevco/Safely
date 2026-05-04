import { describe, expect, it } from 'vitest';

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
        ['unicode', 'привет🙂'],
        ['adjacent escape pairs', '_u_d_u_d'],
        ['only special chars', '_._._.'],
        ['trailing underscore', 'foo_'],
        ['leading dot', '.bar'],
        ['url-ish', 'https://example.com/a_b']
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
