import * as z from 'zod';

import { PortfolioType } from './I-portfolio';
import { PortfolioIdMnemonicBased } from './portfolio-id';
import { sPortfolioMeta } from './portfolio-meta.stored';
import { PortfolioNetworkType } from './portfolio-network-type';
import { sSecretEncrypted } from '../../di/I-secret-encryptor';
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
    encryptedSecret: sSecretEncrypted,
    derivations: z.array(sDerivation)
});
export type SPortfolioBip39Out = z.output<typeof sPortfolioBip39>;
export type SPortfolioBip39In = z.input<typeof sPortfolioBip39>;

export const sPortfolio = sPortfolioBip39;
export type SPortfolioOut = z.output<typeof sPortfolio>;
