import {
    ACTIVITY_GROUP_LABEL,
    ActivityItem,
    ActivityItemsDatedGroup,
    ActivityItemsDatedGroupMeta,
    IActivityFilters
} from './types';
import { useHistory } from './useHistory';

export function useGroupedHistory(filters: IActivityFilters = {}) {
    return useHistory<ActivityItemsDatedGroup[]>(filters, {
        select(data) {
            if (!data?.pages?.length) {
                return [];
            }

            const allItems = data.pages.flatMap(page => page.items);

            return groupActivityItems(allItems);
        }
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

    const grouped = sortedItems.reduce(
        (acc, item) => {
            const groupMeta = JSON.stringify(
                getEventGroupMeta(item.timestamp, todayDate, yesterdayDate)
            );

            if (!acc[groupMeta]) {
                acc[groupMeta] = [];
            }
            acc[groupMeta].push(item);

            return acc;
        },
        {} as Record<string, ActivityItem[]>
    );

    return Object.entries(grouped).map(([key, value]) => {
        const meta = JSON.parse(key) as ActivityItemsDatedGroupMeta;
        return {
            ...meta,
            items: value
        };
    });
}
