import z from 'zod';

import { zIndexedObject } from '@safely/slottree';

import { sPortfolioType, sPortfolioMeta, sPortfolioNetworkType } from './portfolio-common.schema';
import { portfolioWatchOnlyIdToString } from './portfolio-id-string';

export const sPortfolioWatchOnlySource = z.enum(['ADDRESS', 'XPUB']);

export const sPortfolioWatchOnlyIdXpub = z.object({
    source: z.literal(sPortfolioWatchOnlySource.enum.XPUB),
    xpub: z.string(),
    networkType: sPortfolioNetworkType
});
export const sPortfolioWatchOnlyIdAddress = z.object({
    source: z.literal(sPortfolioWatchOnlySource.enum.ADDRESS),
    address: z.string(),
    networkType: sPortfolioNetworkType
});
export const sPortfolioWatchOnlyId = z.discriminatedUnion('source', [
    sPortfolioWatchOnlyIdXpub,
    sPortfolioWatchOnlyIdAddress
]);

export type SPortfolioWatchOnlyIdXpub = z.infer<typeof sPortfolioWatchOnlyIdXpub>;
export type SPortfolioWatchOnlyIdAddress = z.infer<typeof sPortfolioWatchOnlyIdAddress>;
export type SPortfolioWatchOnlyId = z.infer<typeof sPortfolioWatchOnlyId>;

export const sPortfolioWatchOnly = zIndexedObject(
    {
        type: z.literal(sPortfolioType.enum.WATCH_ONLY),
        id: sPortfolioWatchOnlyId,
        meta: sPortfolioMeta
    },
    value => portfolioWatchOnlyIdToString(value.id)
);
export type SPortfolioWatchOnly = z.infer<typeof sPortfolioWatchOnly>;
