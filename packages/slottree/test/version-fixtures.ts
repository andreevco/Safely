import { z } from 'zod';

import type { ContainerSlot } from '../src/core/slots';
import { cloneSlot } from '../src/core/slots/slot-json';
import { projection } from '../src/core/versioning/projection';
import { defineVersionHList, hCons, hNil } from '../src/core/versioning/version';

export const schemaV1 = z.object({
    key1: z.number(),
    key2: z.string()
});

const schemaV2 = z.object({
    key1: z.number(),
    key2: z.string(),
    key3: z.boolean()
});

export const schemaV3 = z.object({
    key1: z.number(),
    label: z.string(),
    key3: z.boolean(),
    key4: z.string()
});

export type StorageV3 = z.output<typeof schemaV3>;
export type StorageV1 = z.output<typeof schemaV1>;

const projectV1ToV2 = projection(schemaV1, schemaV2, s => ({
    key1: s.copy(),
    key2: s.copy(),
    key3: s.default(false)
}));

const projectV2ToV1 = projection(schemaV2, schemaV1, s => ({
    key1: s.copy(),
    key2: s.copy()
}));

const projectV2ToV3 = projection(schemaV2, schemaV3, s => ({
    key1: s.copy(),
    label: s.from('key2'),
    key3: s.copy(),
    key4: s.default('v3')
}));

const projectV3ToV2 = projection(schemaV3, schemaV2, s => ({
    key1: s.copy(),
    key2: s.from('label'),
    key3: s.copy()
}));

export function identityProjection(source: ContainerSlot): ContainerSlot {
    return cloneSlot(source);
}

export const v3 = defineVersionHList(
    hCons(
        {
            version: 3,
            schema: schemaV3,
            initial: {
                key1: 0,
                label: 'initial',
                key3: false,
                key4: 'v3'
            },
            projectUp: projectV2ToV3,
            projectDown: projectV3ToV2
        },
        hCons(
            {
                version: 2,
                schema: schemaV2,
                initial: {
                    key1: 0,
                    key2: 'initial',
                    key3: false
                },
                projectUp: projectV1ToV2,
                projectDown: projectV2ToV1
            },
            hCons(
                {
                    version: 1,
                    schema: schemaV1,
                    initial: {
                        key1: 0,
                        key2: 'initial'
                    },
                    projectUp: identityProjection,
                    projectDown: identityProjection
                },
                hNil
            )
        )
    )
);

export const v1 = defineVersionHList(
    hCons(
        {
            version: 1,
            schema: schemaV1,
            initial: {
                key1: 0,
                key2: 'initial'
            },
            projectUp: identityProjection,
            projectDown: identityProjection
        },
        hNil
    )
);
