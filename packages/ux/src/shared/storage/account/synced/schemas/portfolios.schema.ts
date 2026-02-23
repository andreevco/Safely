import z from 'zod';

import { sPortfolio } from '@safely/core';

export const sPortfolios = z.union([z.array(sPortfolio), z.null()]);
