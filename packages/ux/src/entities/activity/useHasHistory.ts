import type { InfiniteData } from '@tanstack/react-query';
import { useCallback } from 'react';

import type { ActivityPage, IActivityPageParam } from './types';
import { useHistory } from './useHistory';

export function useHasHistory() {
    return useHistory(
        {},
        {
            select: useCallback((data: InfiniteData<ActivityPage, IActivityPageParam>) => {
                return !!data?.pages?.some(p => p.items.length);
            }, [])
        }
    );
}
