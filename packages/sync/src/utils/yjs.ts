import * as Y from 'yjs';

import { StorageError } from '../crdt/y-manager';

export function getAsMap(parent: Y.Map<unknown>, key: string): Y.Map<unknown> {
    const value = parent.get(key);

    if (value === undefined) {
        const map = new Y.Map<unknown>();
        parent.set(key, map);
        return map;
    }

    if (value instanceof Y.Map) {
        return value;
    }

    throw new Error(`Corrupted storage: "${key}" is not a map.`);
}

export function getAsArray<V>(map: Y.Map<unknown>, key: string): Y.Array<V> {
    const value = map.get(key);
    if (value instanceof Y.Array) {
        return value as Y.Array<V>;
    }
    throw new StorageError(`Corrupted storage: "${key}" is not an array.`);
}
