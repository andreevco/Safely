import { z } from 'zod';

import { zIndexedObject } from '@safely/slottree';

import { sPortfolioMetaIcon } from '../portfolio/portfolio-common.schema';

export const sBtcAccountChainItem = z.object({
    xpub: z.string()
});

export const sDerivationChains = z.object({
    btc: sBtcAccountChainItem
});

export const sDerivation = zIndexedObject(
    {
        index: z.number(),
        name: z.string().optional(),
        icon: sPortfolioMetaIcon.optional(),
        chains: sDerivationChains
    },
    value => String(value.index)
);

export type SDerivation = z.infer<typeof sDerivation>;
export type SBtcAccountChainItem = z.infer<typeof sBtcAccountChainItem>;
