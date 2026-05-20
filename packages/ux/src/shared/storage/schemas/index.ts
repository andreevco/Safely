import { sActiveAccountId } from './active-account-id.schema';
import { sAnalyticsOnboardingId } from './analytics-onboarding-id.schema';
import { sChartPeriod } from './chart-period.schema';
import { sDismissedBannerIds } from './dismissed-banner-ids.schema';
import { sNotificationsEnabled } from './notifications-enabled.schema';

export const sharedStorageStructure = {
    activeAccount: sActiveAccountId,
    chartPeriod: sChartPeriod,
    notificationsEnabled: sNotificationsEnabled,
    dismissedBannerIds: sDismissedBannerIds,
    analyticsOnboardingId: sAnalyticsOnboardingId
};

export type SharedStorageStructure = typeof sharedStorageStructure;
