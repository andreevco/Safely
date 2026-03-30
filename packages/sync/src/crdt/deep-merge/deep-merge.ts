import * as Y from 'yjs';
import { z } from 'zod';

import { ArrayMergeMeta } from './array-registry';
import { cloneJson, isArray, isPlainObject } from './helpers';
import { yValueToJs } from './y-value-to-js';
import { getArrayItemSchema, getArrayMeta, getObjectFieldSchema } from './z-schema';

/**
 * Syncs plain object into existing Y.Map:
 * - keys which are not in next or have undefined value are deleted
 * - changed keys are updated with setValueAtKeyStructured (recursive diff)
 */
function syncObjectIntoYMap(
    target: Y.Map<unknown>,
    next: Record<string, unknown>,
    schema: z.ZodTypeAny
): void {
    const existingKeys = Array.from(target.keys());

    for (const key of existingKeys) {
        if (!Object.prototype.hasOwnProperty.call(next, key) || next[key] === undefined) {
            target.delete(key);
        }
    }

    for (const [key, nextValue] of Object.entries(next)) {
        const childSchema = getObjectFieldSchema(schema, key);
        deepMerge(target, key, nextValue, childSchema);
    }
}

function syncArrayIntoYArrayById(
    target: Y.Map<unknown>,
    next: unknown[],
    meta: ArrayMergeMeta,
    itemSchema: z.ZodTypeAny
): void {
    const existing = [];

    for (let i = 0; i < next.length; i++) {
        const nextItem = next[i];

        const id = meta.getId(nextItem);
        const currentItem = target.get(id);

        existing.push(id);

        if (currentItem === undefined) {
            const item = new Y.Map();
            target.set(id, item);

            item.set('index', i);
            deepMerge(item, 'value', nextItem, itemSchema);
            continue;
        }

        if (currentItem instanceof Y.Map) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const index = currentItem.get('index');
            if (typeof index !== 'number') {
                throw new Error('Expected index to be a number, found ' + typeof index);
            }

            if (index !== i) {
                currentItem.set('index', i);
            }
            deepMerge(currentItem, 'value', nextItem, itemSchema);
        }
    }

    // remove items which are not in next
    for (const key of target.keys()) {
        if (!existing.some(id => id === key)) {
            target.delete(key);
        }
    }
}

function syncArrayIntoYMap(target: Y.Map<unknown>, next: unknown[], schema: z.ZodTypeAny): void {
    const meta = getArrayMeta(schema);
    const itemSchema = getArrayItemSchema(schema);

    if (meta.kind === 'by-id') {
        syncArrayIntoYArrayById(target, next, meta, itemSchema);
        return;
    } else {
        throw new Error('Unable to get array item schema');
    }
}

function updateValue(
    parent: Y.Map<unknown>,
    key: string,
    sharedType: unknown,
    value: unknown,
    schema: z.ZodTypeAny,
    f: () => void
): void {
    if (isPlainObject(value)) {
        if (sharedType instanceof Y.Map) {
            syncObjectIntoYMap(sharedType, value, schema);
            return;
        } else if (sharedType === undefined) {
            const newMap = new Y.Map();
            parent.set(key, newMap);
            syncObjectIntoYMap(newMap, value, schema);
            return;
        } else {
            throw new Error('Expected Map, found ' + typeof sharedType);
        }
    } else if (isArray(value)) {
        if (sharedType instanceof Y.Map) {
            syncArrayIntoYMap(sharedType, value, schema);
            return;
        } else if (sharedType === undefined) {
            const newMap = new Y.Map();
            parent.set(key, newMap);
            syncArrayIntoYMap(newMap, value, schema);
            return;
        } else {
            throw new Error('Expected Map, found ' + typeof sharedType);
        }
    } else {
        f();
    }
}

/**
 * Updates value at key in Y.Map with some semantics to allow merging of nested objects.
 *
 * Semantics:
 * - plain object => store as Y.Map and merge with existing
 * - arrays => store as Y.Map using id from meta as key and then merge
 * - primitives => set only if values changed
 * - undefined => delete
 */
export function deepMerge(
    parent: Y.Map<unknown>,
    key: string,
    nextValue: unknown,
    schema: z.ZodTypeAny
): void {
    if (nextValue === undefined) {
        if (parent.has(key)) {
            parent.delete(key);
        }
        return;
    }

    const current = parent.get(key);

    updateValue(parent, key, current, nextValue, schema, () => {
        const currentJs = yValueToJs(current, schema);

        if (currentJs !== nextValue) {
            parent.set(key, cloneJson(nextValue));
        }
    });
}
