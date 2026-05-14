import { z } from 'zod';

import { zIndexedObject } from '@safely/slottree';

export const sBtcAccountChainItem = z.object({
    xpub: z.string()
});
export const sDerivationChains = z.object({
    btc: sBtcAccountChainItem
});

export const sDerivation = zIndexedObject(
    {
        index: z.number(),
        chains: sDerivationChains
    },
    value => String(value.index)
);

export type SDerivation = z.infer<typeof sDerivation>;
export type SBtcAccountChainItem = z.infer<typeof sBtcAccountChainItem>;
