import { z } from 'zod';

import { ORDERED_ARRAY_ITEM_ID_KEY, ORDERED_ARRAY_ITEM_ID_KEY_TYPE } from './slots/slot';

const INDEXED_SCHEMA_BRAND: unique symbol = Symbol('zIndexedSchema');

type IndexedShape<Shape extends z.ZodRawShape> = Shape & {
    [K in typeof ORDERED_ARRAY_ITEM_ID_KEY]: typeof ORDERED_ARRAY_ITEM_ID_KEY_TYPE;
};

type Indexed<Bare> = Bare & { [K in typeof ORDERED_ARRAY_ITEM_ID_KEY]: string };

export interface ZIndexedSerializer<Bare> {
    readonly [INDEXED_SCHEMA_BRAND]: true;
    toJson(value: Bare): Indexed<Bare>;
    jsonArrayId(value: Bare): z.infer<typeof ORDERED_ARRAY_ITEM_ID_KEY_TYPE>;
}

export type ZIndexedObject<Shape extends z.ZodRawShape = z.ZodRawShape> = z.ZodObject<
    IndexedShape<Shape>
> &
    ZIndexedSerializer<z.input<z.ZodObject<Shape>>>;

export const zIndexedObject = <Shape extends z.ZodRawShape>(
    shape: Shape,
    idFactory: (value: z.input<z.ZodObject<Shape>>) => string
): ZIndexedObject<Shape> => {
    const schema = z.object({
        ...shape,
        [ORDERED_ARRAY_ITEM_ID_KEY]: ORDERED_ARRAY_ITEM_ID_KEY_TYPE
    }) as ZIndexedObject<Shape>;

    const toJson = (value: z.input<z.ZodObject<Shape>>): Indexed<z.input<z.ZodObject<Shape>>> => ({
        ...value,
        [ORDERED_ARRAY_ITEM_ID_KEY]: idFactory(value)
    });

    Object.defineProperties(schema, {
        [INDEXED_SCHEMA_BRAND]: { value: true, enumerable: false },
        toJson: { value: toJson, enumerable: false },
        jsonArrayId: {
            value: (value: z.input<z.ZodObject<Shape>>) => idFactory(value),
            enumerable: false
        }
    });

    return schema;
};

export const zIndexedArray = <Item extends z.ZodType>(item: Item): z.ZodArray<Item> =>
    z.array(item);
