import { sActiveAccountId } from './active-account-id.schema';
import { sChartPeriod } from './chart-period.schema';
import { sNotificationsEnabled } from './notifications-enabled.schema';

export const sharedStorageStructure = {
    activeAccount: sActiveAccountId,
    chartPeriod: sChartPeriod,
    notificationsEnabled: sNotificationsEnabled
};

export type SharedStorageStructure = typeof sharedStorageStructure;
