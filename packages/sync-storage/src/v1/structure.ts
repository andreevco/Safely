import { z } from 'zod';

import { projectIdentity } from '@safely/slottree';

import {
    sAnalyticsId,
    sLatestDerivedBip39PortfolioIndex,
    sPreferredFiat,
    sAccountMeta,
    sContacts,
    sDevicesMeta,
    sPortfolios,
    type SContacts,
    type SPortfolios
} from './schemas';

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
