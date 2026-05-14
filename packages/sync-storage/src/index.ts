import { defineVersionHList, hCons, hNil } from '@safely/slottree';

import { syncedStorageV1 } from './v1/structure';

export * from './actual-version';

export const syncedStorageVersions = defineVersionHList(hCons(syncedStorageV1, hNil));

export type SyncedStorageVersions = typeof syncedStorageVersions;

export type SyncedStorageStructure = (typeof syncedStorageVersions)['head'];
