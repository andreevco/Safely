import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import { betaFeedWatchedKeys } from './keys';
import { useAboutQuery, useSharedUxStorage } from '../../shared';

export interface BetaFeedWatched {
    shouldShowBadge: boolean;
    markWatched: () => Promise<void>;
}

export function useBetaFeedWatched(): BetaFeedWatched {
    const queryClient = useQueryClient();
    const { get, set } = useSharedUxStorage('watchedBetaTimestamp');
    const { data: aboutData } = useAboutQuery();
    const { data: stored } = useQuery({
        queryKey: betaFeedWatchedKeys.timestamp.toKey(),
        queryFn: async () => (await get()) ?? null,
        staleTime: Infinity
    });

    const latestTimestamp = useMemo(
        () => aboutData?.posts?.at(-1)?.timestamp ?? null,
        [aboutData?.posts]
    );

    const shouldShowBadge = useMemo<boolean>(() => {
        if (latestTimestamp === null) return false;
        if (stored === undefined) return false;

        if (stored === null) return true;

        return stored < latestTimestamp;
    }, [latestTimestamp, stored]);

    const markWatched = useCallback(async (): Promise<void> => {
        if (latestTimestamp === null) return;
        await set(latestTimestamp);
        queryClient.setQueryData(betaFeedWatchedKeys.timestamp.toKey(), latestTimestamp);
    }, [latestTimestamp, set, queryClient]);

    return { shouldShowBadge, markWatched };
}
