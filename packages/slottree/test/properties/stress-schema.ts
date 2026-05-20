import { z } from 'zod';

import { cloneSlot } from '../../src/core/slots/slot-json';
import { defineVersionHList, hCons, hNil } from '../../src/core/versioning/version';

const Scalar = z.string();

const RichObject = z.object({
    value: Scalar,
    nested: z.object({
        note: Scalar.optional(),
        nullableNote: Scalar.nullable()
    })
});

const ArrayRichObject = RichObject.extend({
    __setId: Scalar
});

const DiscriminatedItem = z.discriminatedUnion('type', [
    z.object({
        type: z.literal('text'),
        value: Scalar
    }),
    z.object({
        type: z.literal('ref'),
        refId: Scalar,
        meta: z.object({
            label: Scalar.optional()
        })
    }),
    z.object({
        type: z.literal('empty')
    })
]);

const ArrayDiscriminatedItem = z.discriminatedUnion('type', [
    z.object({
        __setId: Scalar,
        type: z.literal('text'),
        value: Scalar
    }),
    z.object({
        __setId: Scalar,
        type: z.literal('ref'),
        refId: Scalar,
        meta: z.object({
            label: Scalar.optional()
        })
    }),
    z.object({
        __setId: Scalar,
        type: z.literal('empty')
    })
]);

const AmbiguousA = z.object({
    value: Scalar,
    extra: Scalar.optional()
});

const AmbiguousB = z.object({
    value: Scalar,
    count: Scalar.optional()
});

export const stressSchema = z.object({
    nested: z.object({
        value: Scalar,
        child: z.object({
            value: Scalar
        })
    }),
    optionalObject: RichObject.optional(),
    nullableObject: RichObject.nullable(),
    optionalNullableObject: RichObject.nullable().optional(),
    recordOfObjects: z.record(z.string(), RichObject),
    nestedRecordOfObjects: z.record(z.string(), z.record(z.string(), RichObject)),
    nestedRecordOfNullableObjects: z.record(
        z.string(),
        z.record(z.string(), RichObject.nullable())
    ),
    objectStringNullUnion: z.union([RichObject, Scalar, z.null()]),
    discriminatedUnion: DiscriminatedItem,
    nestedDiscriminatedUnion: z.object({
        id: Scalar,
        item: DiscriminatedItem
    }),
    recordOfDiscriminatedUnions: z.record(z.string(), DiscriminatedItem),
    arrayOfObjects: z.array(ArrayRichObject),
    arrayOfUnions: z.array(z.union([ArrayRichObject, ArrayDiscriminatedItem])),
    tuple: z.tuple([ArrayRichObject, ArrayRichObject, ArrayDiscriminatedItem]),
    ambiguousUnion: z.union([AmbiguousA, AmbiguousB]),
    intersectionObject: z.intersection(
        z.object({
            id: Scalar
        }),
        z.object({
            value: Scalar,
            meta: z.object({
                note: Scalar.optional()
            })
        })
    ),
    catchallObject: z
        .object({
            known: Scalar
        })
        .catchall(z.union([Scalar, z.null(), RichObject, DiscriminatedItem])),
    partialObject: z.object({
        a: Scalar.optional(),
        b: Scalar.optional(),
        child: z
            .object({
                c: Scalar.optional(),
                d: Scalar.nullable().optional()
            })
            .optional()
    }),
    deepMixed: z.record(
        z.string(),
        z.object({
            object: RichObject,
            maybeObject: RichObject.nullable().optional(),
            items: z.array(z.union([ArrayRichObject, ArrayDiscriminatedItem])),
            children: z.record(
                z.string(),
                z.object({
                    item: DiscriminatedItem,
                    value: z.union([Scalar, RichObject, z.null()])
                })
            )
        })
    )
});

export type StressState = z.output<typeof stressSchema>;

export const stressInitial: StressState = {
    nested: {
        value: '',
        child: {
            value: ''
        }
    },
    nullableObject: null,
    recordOfObjects: {},
    nestedRecordOfObjects: {},
    nestedRecordOfNullableObjects: {},
    objectStringNullUnion: null,
    discriminatedUnion: {
        type: 'empty'
    },
    nestedDiscriminatedUnion: {
        id: '',
        item: {
            type: 'empty'
        }
    },
    recordOfDiscriminatedUnions: {},
    arrayOfObjects: [],
    arrayOfUnions: [],
    tuple: [
        {
            __setId: 'tuple-a',
            value: '',
            nested: {
                nullableNote: null
            }
        },
        {
            __setId: 'tuple-b',
            value: '',
            nested: {
                nullableNote: null
            }
        },
        {
            __setId: 'tuple-c',
            type: 'empty'
        }
    ],
    ambiguousUnion: {
        value: ''
    },
    intersectionObject: {
        id: '',
        value: '',
        meta: {}
    },
    catchallObject: {
        known: ''
    },
    partialObject: {},
    deepMixed: {}
};

export const stressVersionList = defineVersionHList(
    hCons(
        {
            version: 1,
            schema: stressSchema,
            initial: stressInitial,
            projectUp: cloneSlot,
            projectDown: cloneSlot
        },
        hNil
    )
);
