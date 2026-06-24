import z from 'zod';

import { zIndexedObject } from '@safely/slottree';

import { sPortfolioMeta } from './portfolio-common.schema';
import {
    sPortfolioBip39Id,
    sPortfolioSecretRevealedStatus
} from '../../../v1/schemas/portfolio/portfolio-bip39.schema';
import { portfolioBip39IdToString } from '../../../v1/schemas/portfolio/portfolio-id-string';
import { sDerivation } from '../derivation';

export const sPortfolioBip39 = zIndexedObject(
    {
        type: z.literal('BIP39'),
        id: sPortfolioBip39Id,
        meta: sPortfolioMeta,
        secretRevealedStatus: sPortfolioSecretRevealedStatus,
        encryptedSecret: z.string(),
        derivations: z.array(sDerivation)
    },
    value => portfolioBip39IdToString(value.id)
);

export type SPortfolioBip39 = z.infer<typeof sPortfolioBip39>;
