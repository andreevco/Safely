import z from 'zod';

import { zIndexedArray } from '@safely/slottree';

import { sPortfolioBip39, type SPortfolioBip39 } from './portfolio-bip39.schema';
import { sPortfolioType } from './portfolio-common.schema';
import { sPortfolioLedger, type SPortfolioLedger } from './portfolio-ledger.schema';
import { sPortfolioWatchOnly } from './portfolio-watch-only.schema';

export const sPortfolio = z.discriminatedUnion('type', [
    sPortfolioBip39,
    sPortfolioLedger,
    sPortfolioWatchOnly
]);

export const sPortfolios = zIndexedArray(sPortfolio);

export type SPortfolio = z.infer<typeof sPortfolio>;
export type SPortfolios = z.infer<typeof sPortfolios>;

export const isDerivableSPortfolio = (
    portfolio: SPortfolio
): portfolio is SPortfolioBip39 | SPortfolioLedger =>
    portfolio.type !== sPortfolioType.enum.WATCH_ONLY;

export const isBip39SPortfolio = (portfolio: SPortfolio): portfolio is SPortfolioBip39 =>
    portfolio.type === sPortfolioType.enum.BIP39;
