import { sActiveAccountId } from './active-account-id.schema';

export const sharedStorageStructure = {
    activeAccount: sActiveAccountId
};

export type SharedStorageStructure = typeof sharedStorageStructure;
