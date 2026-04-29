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
        expect(all.some(k => k.startsWith('_data..users..123') && k.endsWith('..token'))).toBe(
            true
        );
    });

    it('escapes separator in path segments', async () => {
        const base = new InMemoryEnumerableStorage();
        const root = TreeStorage.root(base);
        const sub = root.child('a..b'); // internal separator should be replaced with underscore

        await sub.setItem('x', '1');
        const all = await base.getAllKeys();
        expect(all.some(k => k.startsWith('_data..a_b') && k.endsWith('..x'))).toBe(true);
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
        expect(keys.some(k => k.includes('_data..a..c'))).toBe(true);
    });

    it('recoverIntents triggers clear when clear intent is present', async () => {
        const base = new InMemoryEnumerableStorage();
        const root = TreeStorage.root(base);
        const node = root.child(['scope']);

        await node.setItem('a', '1');
        await node.setItem('b', '2');
        expect((await base.getAllKeys()).length).toBe(2);

        // Set clear intent directly
        await base.setItem('_intent..clear..scope', '1');
        // Any operation should recover and clear first
        const res = await node.getItem('a');
        expect(res).toBeNull();
        // All keys under the path should be cleared
        const keysAfter = await base.getAllKeys();
        expect(keysAfter.every(k => !k.startsWith('_data..scope..'))).toBe(true);
        // Intent should be removed by clear()
        expect(await base.getItem('_intent..clear..scope')).toBeNull();
    });

    it('clear does not remove keys from overlapping path names', async () => {
        const base = new InMemoryEnumerableStorage();
        const root = TreeStorage.root(base);
        const sync = root.child(['root', 'sync']);
        const syncProvider = root.child(['root', 'sync-provider']);

        await sync.setItem('k1', 'v1');
        await syncProvider.setItem('k2', 'v2');

        // Clear only 'root/sync' subtree
        await sync.clear();

        const keys = await base.getAllKeys();
        // Keys under 'root:sync' should be removed
        expect(keys.every(k => !k.startsWith('_data..root..sync..'))).toBe(true);
        // Keys under 'root:sync-provider' should remain
        expect(keys.some(k => k.startsWith('_data..root..sync-provider..'))).toBe(true);
    });
});
