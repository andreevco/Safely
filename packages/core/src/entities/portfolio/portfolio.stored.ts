import * as z from 'zod';

import { zArrayWithKey } from '@safely/sync';

import { PortfolioType } from './I-portfolio';
import { PortfolioIdMnemonicBased } from './portfolio-id';
import { sPortfolioMeta } from './portfolio-meta.stored';
import { PortfolioNetworkType } from './portfolio-network-type';
import { sPortfolioSecretRevealedStatus } from './portfolio-secret-revealed-status.stored';
import { sSecretEncrypted } from '../../di';
import { sDerivation } from '../derivation/derivation.stored';

export const sPortfolioBip39 = z.object({
    id: z
        .object({
            type: z.literal(PortfolioType.BIP39),
            hash: z.string(),
            networkType: z.enum(PortfolioNetworkType)
        })
        .transform(
            val =>
                new PortfolioIdMnemonicBased<PortfolioType.BIP39>(
                    val.type,
                    val.hash,
                    val.networkType
                )
        ),
    meta: sPortfolioMeta,
    secretRevealedStatus: sPortfolioSecretRevealedStatus,
    encryptedSecret: sSecretEncrypted,
    derivations: zArrayWithKey(sDerivation, item => String(item.index))
});
export type SPortfolioBip39Out = z.output<typeof sPortfolioBip39>;
export type SPortfolioBip39In = z.input<typeof sPortfolioBip39>;

export const sPortfolio = sPortfolioBip39;
export type SPortfolioOut = z.output<typeof sPortfolio>;
