import { sActiveAccountId } from './active-account-id.schema';
import { sAmountDisplay } from './amount-display.schema';
import { sChartPeriod } from './chart-period.schema';
import { sDismissedBannerIds } from './dismissed-banner-ids.schema';
import { sDismissedProviders } from './dismissed-providers.schema';
import { sNotificationsEnabled } from './notifications-enabled.schema';
import { sSendAmountInputType } from './send-amount-input-type.schema';
import { sSyncOnboardingCompleted } from './sync-onboarding-completed.schema';
import { sWatchedBetaTimestamp } from './watched-beta-timestamp.schema';

export const sharedStorageStructure = {
    activeAccount: sActiveAccountId,
    chartPeriod: sChartPeriod,
    notificationsEnabled: sNotificationsEnabled,
    dismissedBannerIds: sDismissedBannerIds,
    dismissedProviders: sDismissedProviders,
    watchedBetaTimestamp: sWatchedBetaTimestamp,
    amountDisplay: sAmountDisplay,
    sendAmountInputType: sSendAmountInputType,
    syncOnboardingCompleted: sSyncOnboardingCompleted
};

export type SharedStorageStructure = typeof sharedStorageStructure;

export { sAmountDisplay, type AmountDisplay } from './amount-display.schema';
