import { z } from 'zod';

import { projectIdentity } from '@safely/slottree';

import { sAnalyticsId, sLatestDerivedBip39PortfolioIndex } from './schemas';
import { sAccountMeta } from './schemas/account-meta.schema';
import type { SContacts } from './schemas/contacts.schema';
import { sContacts } from './schemas/contacts.schema';
import { sDevicesMeta } from './schemas/devices-meta.schema';
import type { SPortfolios } from './schemas/portfolio/portfolios.schema';
import { sPortfolios } from './schemas/portfolio/portfolios.schema';
import { sPreferredFiat } from './schemas/preferred-fiat.schema';

const syncedStorageSchema = z.object({
    preferredFiat: sPreferredFiat,
    portfolios: sPortfolios,
    meta: sAccountMeta,
    devicesMeta: sDevicesMeta,
    contacts: sContacts,
    latestDerivedBip39PortfolioIndex: sLatestDerivedBip39PortfolioIndex,
    analyticsId: sAnalyticsId
});

export const syncedStorageV1 = {
    version: 1,
    schema: syncedStorageSchema,
    initial: {
        preferredFiat: null,
        portfolios: [] as SPortfolios,
        meta: null,
        devicesMeta: null,
        contacts: [] as SContacts,
        latestDerivedBip39PortfolioIndex: null,
        analyticsId: null
    },
    projectUp: projectIdentity,
    projectDown: projectIdentity
} as const;
