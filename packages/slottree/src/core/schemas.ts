import { z } from 'zod';

import {
    ORDERED_ARRAY_ITEM_ID_KEY,
    ORDERED_ARRAY_ITEM_ID_KEY_TYPE
} from '../../../slottree/src/core/slots/slot';

type IndexedShape<Shape extends z.ZodRawShape = z.ZodRawShape> = Shape & {
    [K in typeof ORDERED_ARRAY_ITEM_ID_KEY]: typeof ORDERED_ARRAY_ITEM_ID_KEY_TYPE;
};

export type ZIndexedObject<Shape extends z.ZodRawShape = z.ZodRawShape> = z.ZodObject<
    IndexedShape<Shape>
>;

export const zIndexedObject = <Shape extends z.ZodRawShape>(shape: Shape) =>
    z.object({
        ...shape,
        [ORDERED_ARRAY_ITEM_ID_KEY]: ORDERED_ARRAY_ITEM_ID_KEY_TYPE
    });

type IndexedItem = { [K in typeof ORDERED_ARRAY_ITEM_ID_KEY]: string };

export const zIndexedArray = <T extends z.ZodType<IndexedItem>>(schema: T) => z.array(schema);
