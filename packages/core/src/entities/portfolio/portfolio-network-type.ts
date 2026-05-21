import type { z } from 'zod';

import { sPortfolioNetworkType } from '@safely/sync-storage';

export const PortfolioNetworkType = sPortfolioNetworkType.enum;
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type PortfolioNetworkType = z.infer<typeof sPortfolioNetworkType>;
