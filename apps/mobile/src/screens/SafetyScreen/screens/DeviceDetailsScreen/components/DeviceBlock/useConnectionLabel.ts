import { useTranslation } from 'react-i18next';

import { useDateFormatter } from '@safely/ux';

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const DAYS_IN_WEEK = 7;
const MAX_RELATIVE_WEEKS = 4;

type ConnectionLabel = {
    label: string;
    date: string | null;
};

export function useConnectionLabel(lastSyncAt: number | null): ConnectionLabel {
    const { t } = useTranslation();
    const formatDate = useDateFormatter({ day: 'numeric', month: 'short', year: 'numeric' });

    if (lastSyncAt === null) {
        return { label: t('security.deviceDetails.noConnectionYet'), date: null };
    }

    const diffMs = Math.max(0, Date.now() - lastSyncAt);
    const days = Math.floor(diffMs / DAY_MS);
    const weeks = Math.floor(days / DAYS_IN_WEEK);
    const daysAgo = t('security.deviceDetails.daysAgo', { count: days });

    if (diffMs < MINUTE_MS) {
        return { label: t('security.deviceDetails.connectedNow'), date: null };
    }

    if (diffMs < HOUR_MS) {
        return {
            label: t('security.deviceDetails.minutesAgo', {
                count: Math.floor(diffMs / MINUTE_MS)
            }),
            date: null
        };
    }

    if (diffMs < DAY_MS) {
        return {
            label: t('security.deviceDetails.hoursAgo', { count: Math.floor(diffMs / HOUR_MS) }),
            date: null
        };
    }

    if (days === 1) {
        return { label: t('security.deviceDetails.yesterday'), date: null };
    }

    if (days < DAYS_IN_WEEK) {
        return { label: daysAgo, date: null };
    }

    if (weeks <= MAX_RELATIVE_WEEKS) {
        return { label: t('security.deviceDetails.weeksAgo', { count: weeks }), date: null };
    }

    return { label: daysAgo, date: formatDate.format(lastSyncAt) };
}
