import type { ZodType } from 'zod';

import { sAccountMeta } from './account-meta.schema';
import { sPortfolios } from './portfolios.schema';
import { sPreferredFiat } from './preferred-fiat';

export const syncedStorageStructure = {
    preferredFiat: sPreferredFiat,
    portfolios: sPortfolios,
    meta: sAccountMeta
} as const satisfies Record<string, ZodType>;

export type SyncedStorageStructure = typeof syncedStorageStructure;
export { type AccountMeta } from './account-meta.schema';
