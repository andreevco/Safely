import { z } from 'zod';

import { zIndexedObject } from '@safely/slottree';

export const sBtcAccountChainItem = z.object({
    xpub: z.string()
});

export const sDerivationChains = z.object({
    btc: sBtcAccountChainItem
});

export const sDerivationMeta = z.object({
    name: z.string()
});

export const sDerivation = zIndexedObject(
    {
        index: z.number(),
        chains: sDerivationChains
    },
    value => String(value.index)
);

export const sLedgerDerivation = zIndexedObject(
    {
        index: z.number(),
        meta: sDerivationMeta,
        chains: sDerivationChains
    },
    value => String(value.index)
);

export type SDerivation = z.infer<typeof sDerivation>;
export type SLedgerDerivation = z.infer<typeof sLedgerDerivation>;
export type SDerivationMeta = z.infer<typeof sDerivationMeta>;
export type SBtcAccountChainItem = z.infer<typeof sBtcAccountChainItem>;
