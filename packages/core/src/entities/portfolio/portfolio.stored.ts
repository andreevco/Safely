import * as z from 'zod';

import { zArrayWithKey } from '@safely/sync';

import { PortfolioType, WatchOnlySource } from './I-portfolio';
import { PortfolioIdMnemonicBased } from './portfolio-id';
import { PortfolioIdWatchOnly } from './portfolio-id-watch-only';
import { sPortfolioMeta } from './portfolio-meta.stored';
import { PortfolioNetworkType } from './portfolio-network-type';
import { sPortfolioSecretRevealedStatus } from './portfolio-secret-revealed-status.stored';
import { sSecretEncrypted } from '../../di';
import { VMType } from '../blockchain';
import { sDerivation } from '../derivation/derivation.stored';

export const sPortfolioBip39 = z.object({
    id: z
        .object({
            hash: z.string(),
            networkType: z.enum(PortfolioNetworkType)
        })
        .transform(val => new PortfolioIdMnemonicBased(val.hash, val.networkType)),
    meta: sPortfolioMeta,
    type: z.literal(PortfolioType.BIP39),
    secretRevealedStatus: sPortfolioSecretRevealedStatus,
    encryptedSecret: sSecretEncrypted,
    derivations: zArrayWithKey(sDerivation, item => String(item.index))
});
export type SPortfolioBip39Out = z.output<typeof sPortfolioBip39>;
export type SPortfolioBip39In = z.input<typeof sPortfolioBip39>;

export const sPortfolioWatchOnly = z.object({
    id: z
        .object({
            identifier: z.string(),
            source: z.enum(WatchOnlySource),
            networkType: z.enum(PortfolioNetworkType),
            vmType: z.enum(VMType)
        })
        .transform(
            val => new PortfolioIdWatchOnly(val.identifier, val.source, val.networkType, val.vmType)
        ),
    meta: sPortfolioMeta,
    type: z.literal(PortfolioType.WATCH_ONLY),
    address: z.string(),
    xpub: z.string().nullable()
});
export type SPortfolioWatchOnlyOut = z.output<typeof sPortfolioWatchOnly>;
export type SPortfolioWatchOnlyIn = z.input<typeof sPortfolioWatchOnly>;

export const sPortfolio = z.discriminatedUnion('type', [sPortfolioBip39, sPortfolioWatchOnly]);
export type SPortfolioOut = z.output<typeof sPortfolio>;
