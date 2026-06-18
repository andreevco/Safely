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
import type { SPortfolios as SPortfoliosV1 } from '../v1';
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
            .update(
                ['portfolios'],
                portfolios =>
                    portfolios
                        .filter(portfolio => portfolio.type !== 'LEDGER')
                        // TODO I think I will change it after inheriting icons from the parent portfolio
                        .map(portfolio =>
                            portfolio.type === 'BIP39'
                                ? {
                                      ...portfolio,
                                      derivations: portfolio.derivations.map(
                                          ({ name: _name, icon: _icon, ...rest }) => rest
                                      )
                                  }
                                : portfolio
                        ) as unknown as SPortfoliosV1
            )
    )
} as const;
