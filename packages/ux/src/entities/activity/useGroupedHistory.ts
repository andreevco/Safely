import type { InfiniteData } from '@tanstack/react-query';
import { useCallback } from 'react';

import { groupByDateWithPending } from '@safely/core';

import { isActivityItemPending } from './pending';
import type {
    ActivityItem,
    ActivityItemsDatedGroup,
    ActivityPage,
    IActivityFilters,
    IActivityPageParam
} from './types';
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

export function groupActivityItems(items: ActivityItem[]): ActivityItemsDatedGroup[] {
    return groupByDateWithPending(items, item => item.timestamp, {
        order: 'desc',
        getIsPending: isActivityItemPending
    });
}
