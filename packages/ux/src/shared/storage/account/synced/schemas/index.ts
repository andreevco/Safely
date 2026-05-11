import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import type { z, ZodType } from 'zod';

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

export function calcSyncedStorageHash(storage: {
    [K in keyof SyncedStorageStructure]: z.output<SyncedStorageStructure[K]>;
}) {
    const { devicesMeta: _, ...rest } = storage;
    const string = JSON.stringify(rest);
    return bytesToHex(sha256(Buffer.from(string, 'utf8')));
}

export type SyncedStorageStructure = typeof syncedStorageStructure;
export { type AccountMeta } from './account-meta.schema';
export { Contact, type ContactMeta, type SContactOut } from '@safely/core';
export { type DeviceMeta } from './devices-meta.schema';
export { type SeedRevealInfo } from './last-seed-revealed.schema';
