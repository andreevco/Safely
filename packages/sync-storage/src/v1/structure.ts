import { z } from 'zod';

import { projectIdentity } from '@safely/slottree';

import { sAccountMeta } from './schemas/account-meta.schema';
import type { SContacts } from './schemas/contacts.schema';
import { sContacts } from './schemas/contacts.schema';
import { sDevicesMeta } from './schemas/devices-meta.schema';
import type { SPortfolios } from './schemas/portfolio/portfolios.schema';
import { sPortfolios } from './schemas/portfolio/portfolios.schema';
import { sPreferredFiat } from './schemas/preferred-fiat.schema';
import { sWalletDerivation } from './schemas/wallet-derivation.schema';

const syncedStorageSchema = z.object({
    preferredFiat: sPreferredFiat,
    portfolios: sPortfolios,
    meta: sAccountMeta,
    devicesMeta: sDevicesMeta,
    contacts: sContacts,
    walletDerivation: sWalletDerivation
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
        walletDerivation: null
    },
    projectUp: projectIdentity,
    projectDown: projectIdentity
} as const;
