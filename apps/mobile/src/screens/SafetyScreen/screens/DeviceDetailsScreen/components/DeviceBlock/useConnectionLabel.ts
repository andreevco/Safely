import { useTranslation } from 'react-i18next';

import { SPACE } from '@safely/core';
import { useDateFormatter } from '@safely/ux';

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const DAYS_IN_WEEK = 7;
const MAX_RELATIVE_WEEKS = 4;

export function useConnectionLabel(lastSyncAt: number): string {
    const { t } = useTranslation();
    const formatDate = useDateFormatter({ day: 'numeric', month: 'short', year: 'numeric' });

    const diffMs = Math.max(0, Date.now() - lastSyncAt);
    const days = Math.floor(diffMs / DAY_MS);
    const weeks = Math.floor(days / DAYS_IN_WEEK);
    const daysAgo = t('security.deviceDetails.daysAgo', { count: days });

    if (diffMs < MINUTE_MS) {
        return t('security.deviceDetails.connectedNow');
    }

    if (diffMs < HOUR_MS) {
        return t('security.deviceDetails.minutesAgo', { count: Math.floor(diffMs / MINUTE_MS) });
    }

    if (diffMs < DAY_MS) {
        return t('security.deviceDetails.hoursAgo', { count: Math.floor(diffMs / HOUR_MS) });
    }

    if (days === 1) {
        return t('security.deviceDetails.yesterday');
    }

    if (days < DAYS_IN_WEEK) {
        return daysAgo;
    }

    if (weeks <= MAX_RELATIVE_WEEKS) {
        return t('security.deviceDetails.weeksAgo', { count: weeks });
    }

    return `${daysAgo}${SPACE.NBSP}·${SPACE.NBSP}${formatDate.format(lastSyncAt)}`;
}
