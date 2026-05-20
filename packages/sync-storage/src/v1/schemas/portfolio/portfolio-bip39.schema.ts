import z from 'zod';

import { zIndexedObject } from '@safely/slottree';

import { sPortfolioMeta, sPortfolioNetworkType } from './portfolio-common.schema';
import { portfolioBip39IdToString } from './portfolio-id-string';
import { sDerivation } from '../derivation';

export const sPortfolioBip39Source = z.enum(['MASTER_KEY_DERIVED', 'IMPORTED']);

export const sPortfolioBip39IdMasterKeyDerived = z.object({
    source: z.literal(sPortfolioBip39Source.enum.MASTER_KEY_DERIVED),
    derivationIndex: z.number(),
    networkType: sPortfolioNetworkType
});

export const sPortfolioBip39IdImported = z.object({
    source: z.literal(sPortfolioBip39Source.enum.IMPORTED),
    seedHash: z.string(),
    networkType: sPortfolioNetworkType
});

export const sPortfolioBip39Id = z.discriminatedUnion('source', [
    sPortfolioBip39IdMasterKeyDerived,
    sPortfolioBip39IdImported
]);

export type SPortfolioBip39IdImported = z.infer<typeof sPortfolioBip39IdImported>;
export type SPortfolioBip39IdMasterKeyDerived = z.infer<typeof sPortfolioBip39IdMasterKeyDerived>;
export type SPortfolioBip39Id = z.infer<typeof sPortfolioBip39Id>;

export const sPortfolioSecretRevealedStatus = z
    .object({
        revealedAt: z.number(),
        revealedFromDevice: z.string()
    })
    .nullable();

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
