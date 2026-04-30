import { describe, expect, it } from 'vitest';

import { InMemoryEnumerableStorage } from './mocks';
import { TreeStorage } from '../../src';

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
