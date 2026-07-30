import type { z } from 'zod';

import { defineVersionHList, hCons, hNil } from '@safely/slottree';

import { syncedStorageV1 } from './v1/structure';
import { syncedStorageV2 } from './v2/structure';
import { syncedStorageV3 } from './v3/structure';

export * from './actual-version';

export const syncedStorageVersions = defineVersionHList(
    hCons(syncedStorageV3, hCons(syncedStorageV2, hCons(syncedStorageV1, hNil)))
);

export type SyncedStorageVersions = typeof syncedStorageVersions;

export type SyncedStorageStructure = (typeof syncedStorageVersions)['head'];
export type SyncedStorageSchema = z.infer<SyncedStorageStructure['schema']>;
