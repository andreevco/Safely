import type { IEnumerableStorage, ISyncKeyValueStorage } from '@safely/core';

import type { DesktopBridge } from '../../shared/bridge';
import type { StoreScope } from '../../shared/ipc';

/**
 * Files owned by main, not IndexedDB: browser storage is bound to the renderer origin, which
 * differs between the dev server and a packaged build, and the secret scopes need the OS
 * keychain in main anyway.
 */
export function createEnumerableStorage(
    bridge: DesktopBridge,
    scope: StoreScope
): IEnumerableStorage {
    return {
        getItem: key => bridge.store.get(scope, key),
        setItem: (key, value) => bridge.store.set(scope, key, value),
        removeItem: key => bridge.store.remove(scope, key),
        clear: () => bridge.store.clear(scope),
        getAllKeys: () => bridge.store.keys(scope, ''),
        getKeysWithPrefix: prefix => bridge.store.keys(scope, prefix),
        removeItemsWithPrefix: prefix => bridge.store.removeWithPrefix(scope, prefix)
    };
}

const SYNCHRONOUS_PREFIX = 'safely:';

/**
 * Read before React mounts, so it cannot go through asynchronous IPC. `localStorage` is the only
 * synchronous store a sandboxed renderer has; nothing secret is kept here.
 */
export const synchronousStorage: ISyncKeyValueStorage = {
    get: key => localStorage.getItem(SYNCHRONOUS_PREFIX + key),
    set: (key, value) => localStorage.setItem(SYNCHRONOUS_PREFIX + key, value),
    remove: key => {
        localStorage.removeItem(SYNCHRONOUS_PREFIX + key);
    },
    clear: () => {
        /* only our own keys: the origin may hold unrelated browser state */
        for (const key of Object.keys(localStorage)) {
            if (key.startsWith(SYNCHRONOUS_PREFIX)) {
                localStorage.removeItem(key);
            }
        }
    }
};
