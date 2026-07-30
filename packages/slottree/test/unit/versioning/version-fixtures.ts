import { z } from 'zod';

import type { ContainerSlot } from '../../../src/core/slots';
import { cloneSlot } from '../../../src/core/slots/slot-json';
import { patch } from '../../../src/core/versioning/patch';
import { defineVersionHList, hCons, hNil } from '../../../src/core/versioning/version';

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

const projectV1ToV2 = patch(schemaV1, schemaV2, draft => draft.newField([], 'key3', false));

const projectV2ToV1 = patch(schemaV2, schemaV1, draft => draft.deleteField([], 'key3'));

const projectV2ToV3 = patch(schemaV2, schemaV3, draft =>
    draft.rename([], 'key2', 'label').newField([], 'key4', 'v3')
);

const projectV3ToV2 = patch(schemaV3, schemaV2, draft =>
    draft.rename([], 'label', 'key2').deleteField([], 'key4')
);

export function identityPatch(source: ContainerSlot): ContainerSlot {
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
                    projectUp: identityPatch,
                    projectDown: identityPatch
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
            projectUp: identityPatch,
            projectDown: identityPatch
        },
        hNil
    )
);
