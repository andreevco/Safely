import { z } from 'zod';

import { orderedSet } from '@safely/slottree';

import { BtcWalletType } from '../blockchain';

export const sBtcAccountChainItem = z.object({
    wallets: orderedSet(
        z.object({
            type: z.enum(BtcWalletType)
        })
    ),
    xpub: z.string()
});
export type SBtcAccountChainItem = z.infer<typeof sBtcAccountChainItem>;

export const sDerivationChains = z.object({
    btc: sBtcAccountChainItem
});
export type SDerivationChains = z.infer<typeof sDerivationChains>;

export const sPortfolioDerivation = z.object({
    chains: sDerivationChains
});

export type SPortfolioDerivation = z.infer<typeof sPortfolioDerivation>;

export const sDerivation = z.object({
    index: z.number(),
    chains: sDerivationChains
});
export type SDerivation = z.infer<typeof sDerivation>;
