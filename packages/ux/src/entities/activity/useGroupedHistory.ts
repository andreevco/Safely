import type { InfiniteData } from '@tanstack/react-query';
import { useCallback } from 'react';

import { isBtcTransactionPending } from './blockchain-specific/btc';
import type {
    ActivityItem,
    ActivityItemsDatedGroup,
    ActivityItemsDatedGroupMeta,
    ActivityPage,
    IActivityFilters,
    IActivityPageParam
} from './types';
import { ACTIVITY_GROUP_LABEL } from './types';
import { useHistory } from './useHistory';

export function useGroupedHistory(filters: IActivityFilters = {}) {
    return useHistory<ActivityItemsDatedGroup[]>(filters, {
        select: useCallback((data: InfiniteData<ActivityPage, IActivityPageParam>) => {
            if (!data?.pages?.length) {
                return [];
            }

            const allItems = data.pages.flatMap(page => page.items);

            return groupActivityItems(allItems);
        }, [])
    });
}

function getEventGroupMeta(
    timestamp: number,
    today: Date,
    yesterday: Date
): ActivityItemsDatedGroupMeta {
    const date = new Date(timestamp);

    if (today.toDateString() === date.toDateString()) {
        return { label: ACTIVITY_GROUP_LABEL.TODAY };
    }

    if (yesterday.toDateString() === date.toDateString()) {
        return { label: ACTIVITY_GROUP_LABEL.YESTERDAY };
    }

    if (today.getMonth() === date.getMonth() && today.getFullYear() === date.getFullYear()) {
        return {
            label: ACTIVITY_GROUP_LABEL.THIS_MONTH,
            year: date.getFullYear(),
            month: date.getMonth(),
            day: date.getDate()
        };
    }

    if (today.getFullYear() === date.getFullYear()) {
        return {
            label: ACTIVITY_GROUP_LABEL.THIS_YEAR,
            year: date.getFullYear(),
            month: date.getMonth()
        };
    }

    return {
        label: ACTIVITY_GROUP_LABEL.PAST_YEAR,
        month: date.getMonth(),
        year: date.getFullYear()
    };
}

export function groupActivityItems(items: ActivityItem[]): ActivityItemsDatedGroup[] {
    if (items.length === 0) {
        return [];
    }

    const sortedItems = [...items].sort((a, b) => b.timestamp - a.timestamp);

    const todayDate = new Date();
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);

    const pendingItems: ActivityItem[] = [];
    const grouped: Record<string, ActivityItem[]> = {};

    for (const item of sortedItems) {
        if (isBtcTransactionPending(item.transaction.raw)) {
            pendingItems.push(item);
        } else {
            const key = JSON.stringify(getEventGroupMeta(item.timestamp, todayDate, yesterdayDate));
            if (!grouped[key]) {
                grouped[key] = [];
            }
            grouped[key].push(item);
        }
    }

    const datedGroups: ActivityItemsDatedGroup[] = Object.entries(grouped).map(([key, value]) => ({
        ...(JSON.parse(key) as ActivityItemsDatedGroupMeta),
        items: value
    }));

    if (pendingItems.length > 0) {
        return [{ label: ACTIVITY_GROUP_LABEL.PENDING, items: pendingItems }, ...datedGroups];
    }

    return datedGroups;
}
