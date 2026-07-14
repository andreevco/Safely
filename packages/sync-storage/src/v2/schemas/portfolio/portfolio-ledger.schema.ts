import z from 'zod';

import { zIndexedObject } from '@safely/slottree';

import { sPortfolioType, sPortfolioMeta, sPortfolioNetworkType } from './portfolio-common.schema';
import { portfolioLedgerIdToString } from './portfolio-id-string';
import { sLedgerDerivation } from '../derivation';

export const sPortfolioLedgerId = z.object({
    masterFingerprint: z.string(),
    networkType: sPortfolioNetworkType
});

export type SPortfolioLedgerId = z.infer<typeof sPortfolioLedgerId>;

export const sPortfolioLedger = zIndexedObject(
    {
        type: z.literal(sPortfolioType.enum.LEDGER),
        id: sPortfolioLedgerId,
        meta: sPortfolioMeta,
        deviceModel: z.string(),
        derivations: z.array(sLedgerDerivation)
    },
    value => portfolioLedgerIdToString(value.id)
);

export type SPortfolioLedger = z.infer<typeof sPortfolioLedger>;
