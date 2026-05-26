import { sActiveAccountId } from './active-account-id.schema';
import { sAnalyticsOnboardingId } from './analytics-onboarding-id.schema';
import { sChartPeriod } from './chart-period.schema';
import { sDismissedBannerIds } from './dismissed-banner-ids.schema';
import { sNotificationsEnabled } from './notifications-enabled.schema';
import { sWatchedBetaTimestamp } from './watched-beta-timestamp.schema';

export const sharedStorageStructure = {
    activeAccount: sActiveAccountId,
    chartPeriod: sChartPeriod,
    notificationsEnabled: sNotificationsEnabled,
    dismissedBannerIds: sDismissedBannerIds,
    analyticsOnboardingId: sAnalyticsOnboardingId,
    watchedBetaTimestamp: sWatchedBetaTimestamp
};

export type SharedStorageStructure = typeof sharedStorageStructure;
