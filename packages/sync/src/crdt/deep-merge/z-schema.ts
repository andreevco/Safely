import { z } from 'zod';

import { ArrayMergeMeta, crdtRegistry } from './array-registry';

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

        return current;
    }

    return current;
}

export function getObjectFieldSchema(schema: z.ZodTypeAny, key: string): z.ZodTypeAny {
    const unwrapped = unwrapSchema(schema);

    if (unwrapped instanceof z.ZodObject) {
        const shape = unwrapped.shape;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const child = shape[key];
        if (!child) throw new Error(`Unknown schema field: ${key}`);
        return child as z.ZodTypeAny;
    } else {
        throw new Error(`Unable to get object field schema for ${key}`);
    }
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
