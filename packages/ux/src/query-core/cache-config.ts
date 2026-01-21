import { z } from 'zod';

// TODO Get schemas from the core level
export const cacheSchemas = {
    // sRatedCryptoAssetAmountArray,
    // sInfiniteActivityData,
    // sInfiniteTokenActivityData,
    // bootConfigSchema
    _placeholder: z.unknown() // TODO Remove it afterwards
} satisfies Record<string, z.ZodType>;

export type CacheSchemaKey = keyof typeof cacheSchemas;

export function isValidSchemaKey(key: string): key is CacheSchemaKey {
    return key in cacheSchemas;
}
