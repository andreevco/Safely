import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import { z, ZodType } from 'zod';

import { defineVersionHList, hCons, hNil, projectIdentity } from '@safely/slottree';

import { sAccountMeta } from './account-meta.schema';
import { sContacts } from './contacts.schema';
import { sDevicesMeta } from './devices-meta.schema';
import { sPortfolios } from './portfolios.schema';
import { sPreferredFiat } from './preferred-fiat';

export const syncedStorageStructure = {
    preferredFiat: sPreferredFiat,
    portfolios: sPortfolios,
    meta: sAccountMeta,
    devicesMeta: sDevicesMeta,
    contacts: sContacts
} as const satisfies Record<string, ZodType>;

export const syncedStorageSchema = z.object(syncedStorageStructure);

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

export function calcSyncedStorageHash(storage: {
    [K in keyof SyncedStorageShape]: z.output<SyncedStorageShape[K]>;
}) {
    const { devicesMeta: _, ...rest } = storage;
    const string = JSON.stringify(rest);
    return bytesToHex(sha256(Buffer.from(string, 'utf8')));
}

export type SyncedStorageShape = typeof syncedStorageStructure;
export type SyncedStorageSchema = typeof syncedStorageSchema;
export type SyncedStorageStructure = (typeof syncedStorageVersions)['head'];
export { type AccountMeta } from './account-meta.schema';
export { Contact, type ContactMeta, type SContactOut } from '@safely/core';
export { type DeviceMeta } from './devices-meta.schema';
export { type SeedRevealInfo } from './last-seed-revealed.schema';
