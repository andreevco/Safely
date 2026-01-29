import { z } from 'zod';

import { bootConfigSchema } from '@safely/core';
import { sRatedCryptoAssetAmountArray } from '@safely/core';

const sInfiniteActivityData = z.object({
    pages: z.array(
        z.object({
            items: z.array(z.unknown()),
            hasNextPage: z.boolean()
        })
    ),
    pageParams: z.array(z.unknown())
});

export const cacheSchemas = {
    sRatedCryptoAssetAmountArray,
    bootConfig: bootConfigSchema,
    infiniteActivityData: sInfiniteActivityData
} satisfies Record<string, z.ZodType>;

export type CacheSchemaKey = keyof typeof cacheSchemas;

export function isValidSchemaKey(key: string): key is CacheSchemaKey {
    return key in cacheSchemas;
}
