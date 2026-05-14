import z from 'zod';

import { zIndexedArray } from '@safely/slottree';

import { sPortfolioBip39 } from './portfolio-bip39.schema';
import { sPortfolioWatchOnly } from './portfolio-watch-only.schema';

export const sPortfolio = z.discriminatedUnion('type', [sPortfolioBip39, sPortfolioWatchOnly]);

export const sPortfolios = zIndexedArray(sPortfolio).nullable();

export type SPortfolio = z.infer<typeof sPortfolio>;
export type SPortfolios = z.infer<typeof sPortfolios>;
