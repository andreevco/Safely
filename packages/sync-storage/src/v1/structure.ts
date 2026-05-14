import { z } from 'zod';

import { defineVersionHList, hCons, hNil, projectIdentity } from '@safely/slottree';

import { sAccountMeta } from './schemas/account-meta.schema';
import { sContacts } from './schemas/contacts.schema';
import { sDevicesMeta } from './schemas/devices-meta.schema';
import { sPortfolios } from './schemas/portfolio/portfolios.schema';
import { sPreferredFiat } from './schemas/preferred-fiat.schema';

const syncedStorageSchema = z.object({
    preferredFiat: sPreferredFiat,
    portfolios: sPortfolios,
    meta: sAccountMeta,
    devicesMeta: sDevicesMeta,
    contacts: sContacts
});

export const syncedStorageV1 = {
    version: 1,
    schema: syncedStorageSchema,
    initial: {
        preferredFiat: null,
        portfolios: null,
        meta: null,
        devicesMeta: null,
        contacts: null
    },
    projectUp: projectIdentity,
    projectDown: projectIdentity
} as const;

export const syncedStorageVersions = defineVersionHList(hCons(syncedStorageV1, hNil));

export type SyncedStorageStructure = (typeof syncedStorageVersions)['head'];
