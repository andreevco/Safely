import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { dismissedProvidersKeys } from './keys';
import { useSharedUxStorage } from '../../shared';

export function useDismissedProvidersQuery() {
    const { get } = useSharedUxStorage('dismissedProviders');

    return useQuery({
        queryKey: dismissedProvidersKeys.ids.toKey(),
        queryFn: async () => (await get()) ?? [],
        staleTime: Infinity
    });
}

export function useClearDismissedProviders() {
    const { set } = useSharedUxStorage('dismissedProviders');

    return useMutation({
        mutationFn: async () => {
            await set([]);
        }
    });
}

export function useDismissProvider() {
    const queryClient = useQueryClient();
    const { get, set } = useSharedUxStorage('dismissedProviders');

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
            queryClient.setQueryData(dismissedProvidersKeys.ids.toKey(), next);
        }
    });
}
