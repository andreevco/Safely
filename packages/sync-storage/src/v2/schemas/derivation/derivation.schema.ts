import { z } from 'zod';

import { zIndexedObject } from '@safely/slottree';

import { sDerivationChains } from '../../../v1/schemas/derivation';

export const sDerivationMeta = z.object({
    name: z.string()
});

export const sLedgerDerivation = zIndexedObject(
    {
        index: z.number(),
        meta: sDerivationMeta,
        chains: sDerivationChains
    },
    value => String(value.index)
);

export type SLedgerDerivation = z.infer<typeof sLedgerDerivation>;
export type SDerivationMeta = z.infer<typeof sDerivationMeta>;
