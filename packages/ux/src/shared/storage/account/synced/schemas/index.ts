import type { ZodType } from 'zod';

import { sAccountDataSchema } from './account-data.schema';
import { sPortfolios } from './portfolios.schema';
import { sPreferredFiat } from './preferred-fiat';

export const syncedStorageStructure = {
    preferredFiat: sPreferredFiat,
    portfolios: sPortfolios,
    accountData: sAccountDataSchema
} as const satisfies Record<string, ZodType>;

export type SyncedStorageStructure = typeof syncedStorageStructure;
