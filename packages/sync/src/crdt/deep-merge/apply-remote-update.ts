import * as Y from 'yjs';
import { z } from 'zod';

import { Leaf, LeafSchema } from './deep-merge';
import { yValueToJs } from './y-value-to-js';
import {
    getArrayItemSchema,
    getArrayMeta,
    getObjectFieldSchema,
    resolveSchemaForValue
} from './z-schema';

function traverseArray(
    temp: Y.Map<unknown>,
    local: Y.Map<unknown>,
    remote: Y.Map<unknown>,
    schema: z.ZodTypeAny
) {
    const meta = getArrayMeta(schema);
    const itemSchema = getArrayItemSchema(schema);

    if (meta.kind === 'by-id') {
        for (const [tempKey, tempEntry] of temp.entries()) {
            const localEntry = local.get(tempKey);
            const remoteEntry = remote.get(tempKey);
            if (localEntry === undefined || remoteEntry === undefined) {
                continue;
            }

            if (
                tempEntry instanceof Y.Map &&
                localEntry instanceof Y.Map &&
                remoteEntry instanceof Y.Map
            ) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                const tempValue = tempEntry.get('value');
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                const localValue = localEntry.get('value');
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                const remoteValue = remoteEntry.get('value');

                if (
                    tempValue instanceof Y.Map &&
                    localValue instanceof Y.Map &&
                    remoteValue instanceof Y.Map
                ) {
                    applyRemoteUpdate(tempValue, localValue, remoteValue, itemSchema);
                } else {
                    const merged = mergeLeaf(
                        LeafSchema.parse(localValue),
                        LeafSchema.parse(remoteValue)
                    );
                    if (merged !== tempValue) {
                        tempEntry.set('value', merged);
                    }
                }
            }
        }
        return;
    } else {
        throw new Error('Unable to get array item schema');
    }
}

// TODO: this doesnt work on types alike z.union([z.object(...), null])
export function applyRemoteUpdate(
    temp: Y.Map<unknown>,
    local: Y.Map<unknown>,
    remote: Y.Map<unknown>,
    schema: z.ZodTypeAny
): void {
    // TODO: should we traverse local/remote keys?
    for (const [key, value] of temp.entries()) {
        const fieldSchema = getObjectFieldSchema(schema, key);
        // TODO: perf
        const resolved = resolveSchemaForValue(fieldSchema, yValueToJs(value, fieldSchema));

        if (resolved instanceof z.ZodObject || resolved instanceof z.ZodRecord) {
            const localValue = local.get(key);
            const remoteValue = remote.get(key);
            if (
                value instanceof Y.Map &&
                localValue instanceof Y.Map &&
                remoteValue instanceof Y.Map
            ) {
                applyRemoteUpdate(value, localValue, remoteValue, resolved);
            }
        } else if (resolved instanceof z.ZodArray) {
            const localValue = local.get(key);
            const remoteValue = remote.get(key);

            if (
                value instanceof Y.Map &&
                localValue instanceof Y.Map &&
                remoteValue instanceof Y.Map
            ) {
                traverseArray(value, localValue, remoteValue, resolved);
            }
        } else {
            if (!local.has(key) || !remote.has(key)) {
                continue;
            }
            const merged = mergeLeaf(
                LeafSchema.parse(local.get(key)),
                LeafSchema.parse(remote.get(key))
            );
            if (merged !== value) {
                temp.set(key, merged);
            }
        }
    }
}

function dominates(a: Record<string, number>, b: Record<string, number>): boolean {
    let strictlyGreater = false;
    const ids = new Set([...Object.keys(a), ...Object.keys(b)]);

    for (const id of ids) {
        const av = a[id] ?? 0;
        const bv = b[id] ?? 0;
        if (av < bv) return false;
        if (av > bv) strictlyGreater = true;
    }

    return strictlyGreater;
}

function pointwiseMax(
    a: Record<string, number>,
    b: Record<string, number>
): Record<string, number> {
    const out: Record<string, number> = {};
    const ids = new Set([...Object.keys(a), ...Object.keys(b)]);

    for (const id of ids) {
        out[id] = Math.max(a[id] ?? 0, b[id] ?? 0);
    }

    return out;
}

function pointwiseMin(
    a: Record<string, number>,
    b: Record<string, number>
): Record<string, number> {
    const out: Record<string, number> = {};
    const ids = new Set([...Object.keys(a), ...Object.keys(b)]);

    for (const id of ids) {
        out[id] = Math.min(a[id] ?? 0, b[id] ?? 0);
    }

    return out;
}

function mergeLeaf<T>(local: Leaf<T>, remote: Leaf<T>): Leaf<T> {
    const joinedVV = pointwiseMax(local.vv, remote.vv);

    let winner: Leaf<T>;

    if (dominates(local.vv, remote.vv)) {
        winner = local;
    } else if (dominates(remote.vv, local.vv)) {
        winner = remote;
    } else {
        // concurrent branches
        const common = pointwiseMin(local.vv, remote.vv);

        const localScore = Object.keys(joinedVV).reduce(
            (sum, id) => sum + ((local.vv[id] ?? 0) - (common[id] ?? 0)),
            0
        );

        const remoteScore = Object.keys(joinedVV).reduce(
            (sum, id) => sum + ((remote.vv[id] ?? 0) - (common[id] ?? 0)),
            0
        );

        if (localScore > remoteScore) {
            winner = local;
        } else if (remoteScore > localScore) {
            winner = remote;
        } else {
            const lk = `${local.lastWriter}:${local.lastSeq}`;
            const rk = `${remote.lastWriter}:${remote.lastSeq}`;
            winner = lk >= rk ? local : remote;
        }
    }

    return {
        value: winner.value,
        vv: joinedVV,
        lastWriter: winner.lastWriter,
        lastSeq: winner.lastSeq
    };
}
