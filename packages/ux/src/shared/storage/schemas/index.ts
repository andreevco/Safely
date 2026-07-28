import { sActiveAccountId } from './active-account-id.schema';
import { sAmountDisplayOrder } from './amount-display-order.schema';
import { sChartPeriod } from './chart-period.schema';
import { sDismissedBannerIds } from './dismissed-banner-ids.schema';
import { sDismissedProviders } from './dismissed-providers.schema';
import { sMainBalanceUnit } from './main-balance-unit.schema';
import { sNotificationsEnabled } from './notifications-enabled.schema';
import { sSendAmountInputType } from './send-amount-input-type.schema';
import { sShowFullSentAmount } from './show-full-sent-amount.schema';
import { sSyncOnboardingCompleted } from './sync-onboarding-completed.schema';
import { sWatchedBetaTimestamp } from './watched-beta-timestamp.schema';

export const sharedStorageStructure = {
    activeAccount: sActiveAccountId,
    chartPeriod: sChartPeriod,
    notificationsEnabled: sNotificationsEnabled,
    dismissedBannerIds: sDismissedBannerIds,
    dismissedProviders: sDismissedProviders,
    watchedBetaTimestamp: sWatchedBetaTimestamp,
    mainBalanceUnit: sMainBalanceUnit,
    homeScreenAmountOrder: sAmountDisplayOrder,
    transactionHistoryAmountOrder: sAmountDisplayOrder,
    showFullSentAmount: sShowFullSentAmount,
    sendAmountInputType: sSendAmountInputType,
    syncOnboardingCompleted: sSyncOnboardingCompleted
};

export type SharedStorageStructure = typeof sharedStorageStructure;
