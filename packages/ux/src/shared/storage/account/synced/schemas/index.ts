import type { ZodType } from 'zod';

import { sAccountMeta } from './account-meta.schema';
import { sDevicesMeta } from './devices-meta.schema';
import { sLastSeedRevealedAt } from './last-seed-revealed.schema';
import { sPortfolios } from './portfolios.schema';
import { sPreferredFiat } from './preferred-fiat';

export const syncedStorageStructure = {
    preferredFiat: sPreferredFiat,
    portfolios: sPortfolios,
    meta: sAccountMeta,
    devicesMeta: sDevicesMeta,
    lastSeedRevealedAt: sLastSeedRevealedAt
} as const satisfies Record<string, ZodType>;

export type SyncedStorageStructure = typeof syncedStorageStructure;
export { type AccountMeta } from './account-meta.schema';
export { type DeviceMeta } from './devices-meta.schema';
export { type SeedRevealInfo } from './last-seed-revealed.schema';
