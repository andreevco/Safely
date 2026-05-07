import { z } from 'zod';

import type { ArrayMergeMeta } from './array-registry';
import { crdtRegistry } from './array-registry';

export function unwrapSchema(schema: z.ZodTypeAny): z.ZodTypeAny {
    let current = schema;

    while (current) {
        if (current instanceof z.ZodOptional || current instanceof z.ZodNullable) {
            current = current.unwrap() as z.ZodTypeAny;
            continue;
        }

        if (current instanceof z.ZodDefault) {
            current = current.removeDefault() as z.ZodTypeAny;
            continue;
        }

        if (current instanceof z.ZodPipe) {
            current = current._zod.def.in as z.ZodTypeAny;
            continue;
        }

        if (current instanceof z.ZodUnion) {
            const options = current.options as z.ZodTypeAny[];
            const nonNull = options.filter(
                o => !(o instanceof z.ZodNull || o instanceof z.ZodUndefined)
            );
            if (nonNull.length === 1) {
                current = nonNull[0];
                continue;
            }
        }

        return current;
    }

    return current;
}

export function resolveSchemaForValue(schema: z.ZodTypeAny, value: unknown): z.ZodTypeAny {
    const unwrapped = unwrapSchema(schema);

    if (!(unwrapped instanceof z.ZodUnion)) {
        return unwrapped;
    }

    const options = unwrapped.options as z.ZodTypeAny[];
    for (const option of options) {
        if (option.safeParse(value).success) {
            return unwrapSchema(option);
        }
    }

    return unwrapped;
}

export function getObjectFieldSchema(schema: z.ZodTypeAny, key: string): z.ZodTypeAny {
    const unwrapped = unwrapSchema(schema);

    if (unwrapped instanceof z.ZodObject) {
        const shape = unwrapped.shape;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const child = shape[key];
        if (!child) throw new Error(`Unknown schema field: ${key}`);
        return child as z.ZodTypeAny;
    }

    if (unwrapped instanceof z.ZodRecord) {
        return unwrapped.valueType as z.ZodTypeAny;
    }

    if (unwrapped instanceof z.ZodUnion) {
        const options = unwrapped.options as z.ZodTypeAny[];
        for (const option of options) {
            try {
                return getObjectFieldSchema(option, key);
            } catch {
                // ignore and try next option
            }
        }
    }

    throw new Error(`Unable to get object field schema for ${key}`);
}

export function getArrayItemSchema(schema: z.ZodTypeAny): z.ZodTypeAny {
    const unwrapped = unwrapSchema(schema);

    if (unwrapped instanceof z.ZodArray) {
        return unwrapped.element as z.ZodTypeAny;
    } else {
        throw new Error('Unable to get array item schema');
    }
}

export function getArrayMeta(schema: z.ZodTypeAny): ArrayMergeMeta {
    const unwrapped = unwrapSchema(schema);

    const meta = crdtRegistry.get(unwrapped);
    if (!meta) {
        throw new Error('Unable to get array meta');
    }
    return meta;
}

export function validateSyncDataScheme(structure: Record<string, z.ZodTypeAny>): void {
    assertAllArraysRegistered(structure);
}

function assertAllArraysRegistered(structure: Record<string, z.ZodTypeAny>): void {
    for (const [key, schema] of Object.entries(structure)) {
        assertArraysRegisteredInSchema(schema, key);
    }
}

function assertArraysRegisteredInSchema(schema: z.ZodTypeAny, path: string): void {
    const unwrapped = unwrapSchema(schema);

    if (unwrapped instanceof z.ZodArray) {
        const meta = crdtRegistry.get(unwrapped);
        if (!meta || typeof meta.getId !== 'function' || meta.kind !== 'by-id') {
            throw new Error(
                `Array at "${path}" must be wrapped with arrayById(). ` +
                    'All arrays in synced storage must have a getId function for deep merge.'
            );
        }
        assertArraysRegisteredInSchema(unwrapped.element as z.ZodTypeAny, `${path}[]`);
    } else if (unwrapped instanceof z.ZodObject) {
        const shape = unwrapped.shape as Record<string, z.ZodTypeAny>;
        for (const [key, value] of Object.entries(shape)) {
            assertArraysRegisteredInSchema(value, `${path}.${key}`);
        }
    } else if (unwrapped instanceof z.ZodUnion) {
        for (const option of unwrapped.options as z.ZodTypeAny[]) {
            assertArraysRegisteredInSchema(option, path);
        }
    } else if (unwrapped instanceof z.ZodRecord) {
        assertArraysRegisteredInSchema(unwrapped.valueType as z.ZodTypeAny, `${path}[*]`);
    }
}
