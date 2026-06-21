import { z } from 'zod';

import { patch } from '@safely/slottree';

import {
    sAccountMeta,
    sAnalyticsId,
    sDevicesMeta,
    sPortfolios,
    sContacts,
    sPreferredFiat,
    type SContacts,
    type SPortfolios,
    sNextDerivingPortfolioInfo
} from './schemas';
import { sPortfolios as sPortfoliosV2 } from '../v2';
import { syncedStorageV2 } from '../v2/structure';

const syncedStorageSchema = z.object({
    preferredFiat: sPreferredFiat,
    portfolios: sPortfolios,
    meta: sAccountMeta,
    devicesMeta: sDevicesMeta,
    contacts: sContacts,
    nextDerivingPortfolioInfo: sNextDerivingPortfolioInfo,
    analyticsId: sAnalyticsId
});

export const syncedStorageV3 = {
    version: 3,
    schema: syncedStorageSchema,
    initial: {
        preferredFiat: null,
        portfolios: [] as SPortfolios,
        meta: null,
        devicesMeta: null,
        contacts: [] as SContacts,
        nextDerivingPortfolioInfo: null,
        analyticsId: null
    },
    projectUp: patch(syncedStorageV2.schema, syncedStorageSchema, draft => draft),
    projectDown: patch(syncedStorageSchema, syncedStorageV2.schema, draft =>
        draft.update(['portfolios'], portfolios =>
            sPortfoliosV2.parse(portfolios.filter(portfolio => portfolio.type !== 'LEDGER'))
        )
    )
} as const;
