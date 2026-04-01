import * as Y from 'yjs';
import { z } from 'zod';

import {
    getArrayItemSchema,
    getArrayMeta,
    getObjectFieldSchema,
    resolveSchemaForValue
} from './z-schema';

export function yValueToJs(value: unknown, schema: z.ZodTypeAny): unknown {
    if (value instanceof Y.Map) {
        const schemaUnwrapped = resolveSchemaForValue(schema, value.toJSON());

        if (schemaUnwrapped instanceof z.ZodArray) {
            const itemSchema = getArrayItemSchema(schemaUnwrapped);
            const meta = getArrayMeta(schemaUnwrapped);

            return Array.from(value.values())
                .map(val => {
                    if (!(val instanceof Y.Map)) {
                        throw new Error('Expected Map, found ' + typeof val);
                    }
                    return {
                        index: val.get('index') as number,
                        value: yValueToJs(val.get('value'), itemSchema)
                    };
                })
                .sort((x, y) => {
                    if (x.index > y.index) {
                        return 1;
                    } else if (x.index < y.index) {
                        return -1;
                    } else {
                        const idx = meta.getId(x.value);
                        const idy = meta.getId(y.value);
                        return idx.localeCompare(idy);
                    }
                })
                .map(x => x.value);
        }

        const obj: Record<string, unknown> = {};
        for (const [key, val] of value.entries()) {
            obj[key] = yValueToJs(val, getObjectFieldSchema(schemaUnwrapped, key));
        }
        return obj;
    }
    return value;
}
