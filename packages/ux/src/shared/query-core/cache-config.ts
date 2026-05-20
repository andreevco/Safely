import { z } from 'zod';

import { bootConfigSchema, sCryptoAssetAmount } from '@safely/core';
import { UtxoSchema, UtxoWithOptionalTxSchema } from '@safely/core/api/btc';

const sHistoricalPrice = z.object({
    prices: z.array(z.tuple([z.number(), z.number()])).describe('[timestamp, price] pair')
});

const sActivityItem = z.object({
    timestamp: z.number(),
    key: z.string(),
    transaction: z.object({
        isInitiator: z.boolean(),
        fromAddress: z.string(),
        toAddress: z.string(),
        value: sCryptoAssetAmount,
        fee: sCryptoAssetAmount,
        raw: z.unknown()
    })
});

const sInfiniteActivityData = z.object({
    pages: z.array(
        z.object({
            items: z.array(sActivityItem),
            hasNextPage: z.boolean()
        })
    ),
    pageParams: z.array(z.unknown())
});

export const cacheSchemas = {
    sBtcWalletUtxos: z.object({
        confirmed: z.object({
            totalAmount: sCryptoAssetAmount,
            utxos: z.array(UtxoSchema)
        }),
        unconfirmedSafe: z.object({
            totalAmount: sCryptoAssetAmount,
            utxos: z.array(UtxoWithOptionalTxSchema)
        }),
        unconfirmedUnsafe: z.object({
            totalAmount: sCryptoAssetAmount,
            utxos: z.array(UtxoWithOptionalTxSchema)
        }),
        hasLocalNotBroadcastedCache: z.boolean()
    }),
    bootConfig: bootConfigSchema,
    infiniteActivityData: sInfiniteActivityData,
    sHistoricalPrice: sHistoricalPrice
} satisfies Record<string, z.ZodType>;

export type CacheSchemaKey = keyof typeof cacheSchemas;

export function isValidSchemaKey(key: string): key is CacheSchemaKey {
    return key in cacheSchemas;
}
