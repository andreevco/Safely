import * as Y from 'yjs';
import { z } from 'zod';

import { LeafSchema } from './deep-merge';
import {
    getArrayItemSchema,
    getArrayMeta,
    getObjectFieldSchema,
    resolveSchemaForValue
} from './z-schema';

export function yValueToJs(value: unknown, schema: z.ZodTypeAny): unknown {
    if (value instanceof Y.Map) {
        const schemaUnwrapped = resolveSchemaForValue(schema, prepareJsonForZod(value.toJSON()));

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
    const leaf = LeafSchema.parse(value);
    return leaf.value;
}

// TODO: there is more clean way to do this
function prepareJsonForZod(obj: any): any {
    if (obj === null || typeof obj !== 'object') return obj;

    if ('vv' in obj && 'value' in obj && 'lastWriter' in obj) {
        return prepareJsonForZod(obj.value);
    }

    if (Array.isArray(obj)) {
        return obj.map(prepareJsonForZod);
    }

    const keys = Object.keys(obj);

    if (keys.length > 0) {
        const isCRDTArray = keys.every(k => {
            const v = obj[k];
            return v && typeof v === 'object' && typeof v.index === 'number' && 'value' in v;
        });

        if (isCRDTArray) {
            return Object.values(obj)
                .sort((a: any, b: any) => a.index - b.index)
                .map((x: any) => prepareJsonForZod(x.value));
        }
    }

    // 3. Обычный объект
    const res: any = {};
    for (const key of keys) {
        res[key] = prepareJsonForZod(obj[key]);
    }
    return res;
}
