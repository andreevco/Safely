import { z } from 'zod';

import { bootConfigSchema, sCryptoAssetAmount } from '@safely/core';
import { UtxoSchema } from '@safely/core/api/btc/models';

const sHistoricalPrice = z.object({
    prices: z.array(z.tuple([z.number(), z.number()])).describe('[timestamp, price] pair')
});

const sSendFormDraft = z.object({
    recipient: z.string(),
    amount: z.string().optional(),
    amountInputType: z.enum(['crypto', 'fiat']).optional(),
    isMax: z.boolean().optional(),
    stepIndex: z.number().optional(),
    selectedAddress: z.string().optional(),
    suggestionAddresses: z.array(z.string()).optional()
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
        confirmedIn: z.object({
            totalAmount: sCryptoAssetAmount
        }),
        unconfirmedInSafe: z.object({
            totalAmount: sCryptoAssetAmount,
            utxos: z.array(UtxoSchema)
        }),
        unconfirmedInUnsafe: z.object({
            totalAmount: sCryptoAssetAmount,
            utxos: z.array(UtxoSchema)
        }),
        unconfirmedOut: z.object({
            totalAmount: sCryptoAssetAmount,
            utxos: z.array(
                z.object({
                    txid: z.string(),
                    vout: z.number(),
                    value: z.string()
                })
            )
        })
    }),
    bootConfig: bootConfigSchema,
    infiniteActivityData: sInfiniteActivityData,
    sHistoricalPrice: sHistoricalPrice,
    sendFormDraft: sSendFormDraft
} satisfies Record<string, z.ZodType>;

export type CacheSchemaKey = keyof typeof cacheSchemas;

export function isValidSchemaKey(key: string): key is CacheSchemaKey {
    return key in cacheSchemas;
}
