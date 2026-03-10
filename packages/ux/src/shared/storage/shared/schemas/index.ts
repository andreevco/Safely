import { sActiveAccountId } from './active-account-id.schema';
import { sNotificationsEnabled } from './notifications-enabled.schema';

export const sharedStorageStructure = {
    activeAccount: sActiveAccountId,
    notificationsEnabled: sNotificationsEnabled
};

export type SharedStorageStructure = typeof sharedStorageStructure;
