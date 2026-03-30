import { z } from 'zod';

export type ArrayMergeMeta = {
    kind: 'by-id';
    getId: (item: unknown) => string;
};

export const crdtRegistry = z.registry<ArrayMergeMeta>();

/**
 * Creates a Zod schema for an array with unique identifier.
 * @param itemSchema
 * @param getId - MUST return unique id for the item, otherwise items will overwrite each other.
 */
export function arrayById<Item extends z.ZodTypeAny>(
    itemSchema: Item,
    getId: (item: z.output<Item>) => string
): z.ZodArray<Item> {
    const schema = z.array(itemSchema);
    schema.register(crdtRegistry, {
        kind: 'by-id',
        getId: getId as (item: unknown) => string
    });
    return schema;
}
