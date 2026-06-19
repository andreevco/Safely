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
import { sPortfolios as sPortfoliosV1 } from '../v1';
import { syncedStorageV1 } from '../v1/structure';

const syncedStorageSchema = z.object({
    preferredFiat: sPreferredFiat,
    portfolios: sPortfolios,
    meta: sAccountMeta,
    devicesMeta: sDevicesMeta,
    contacts: sContacts,
    nextDerivingPortfolioInfo: sNextDerivingPortfolioInfo,
    analyticsId: sAnalyticsId
});

export const syncedStorageV2 = {
    version: 2,
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
    projectUp: patch(syncedStorageV1.schema, syncedStorageSchema, draft =>
        draft
            .rename('latestDerivedBip39PortfolioIndex', 'nextDerivingPortfolioInfo')
            .update(['nextDerivingPortfolioInfo'], index =>
                index == null ? null : { index: index + 1 }
            )
    ),
    projectDown: patch(syncedStorageSchema, syncedStorageV1.schema, draft =>
        draft
            .rename('nextDerivingPortfolioInfo', 'latestDerivedBip39PortfolioIndex')
            .update(['latestDerivedBip39PortfolioIndex'], info =>
                info == null || info.index === 0 ? null : info.index - 1
            )
            .update(['portfolios'], portfolios =>
                sPortfoliosV1.parse(portfolios.filter(portfolio => portfolio.type !== 'LEDGER'))
            )
    )
} as const;
