import { z } from 'zod';

export type ArrayMergeMeta = {
    kind: 'by-id';
    getId: (item: unknown) => string;
};

export const crdtRegistry = z.registry<ArrayMergeMeta>();

/**
 * Compatibility wrapper for callers that still annotate arrays with merge keys.
 * Slottree owns merge behavior now, so the metadata is retained only for validation callers.
 */
export function zArrayWithKey<Item extends z.ZodType>(
    itemSchema: Item,
    getId: (item: z.input<Item>) => string
): z.ZodArray<Item> {
    const schema = z.array(itemSchema);
    schema.register(crdtRegistry, {
        kind: 'by-id',
        getId: getId as (item: unknown) => string
    });
    return schema;
}

export const arrayById = zArrayWithKey;
