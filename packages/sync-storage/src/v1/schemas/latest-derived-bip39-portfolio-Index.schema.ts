import { z } from 'zod';

export const sLatestDerivedBip39PortfolioIndex = z.number().int().nonnegative().nullable();
