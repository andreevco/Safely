import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { dismissedBannersKeys } from './keys';
import { useSharedUxStorage } from '../../shared';

export function useDismissedBannerIdsQuery() {
    const { get } = useSharedUxStorage('dismissedBannerIds');

    return useQuery({
        queryKey: dismissedBannersKeys.ids.toKey(),
        queryFn: async () => (await get()) ?? [],
        staleTime: Infinity
    });
}

export function useClearDismissedBannerIds() {
    const { set } = useSharedUxStorage('dismissedBannerIds');

    return useMutation({
        mutationFn: async () => {
            await set([]);
        }
    });
}

export function useDismissBanner() {
    const queryClient = useQueryClient();
    const { get, set } = useSharedUxStorage('dismissedBannerIds');

    return useMutation<string[], Error, string>({
        mutationFn: async id => {
            const current = (await get()) ?? [];
            if (current.includes(id)) {
                return current;
            }
            const next = [...current, id];
            await set(next);
            return next;
        },
        onSuccess(next) {
            queryClient.setQueryData(dismissedBannersKeys.ids.toKey(), next);
        }
    });
}
