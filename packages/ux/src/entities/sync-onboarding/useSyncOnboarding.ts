import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { syncOnboardingKeys } from './keys';
import { useSharedUxStorage } from '../../shared';

export function useSyncOnboardingCompletedQuery() {
    const { get } = useSharedUxStorage('syncOnboardingCompleted');

    return useQuery({
        queryKey: syncOnboardingKeys.completed.toKey(),
        queryFn: async () => (await get()) ?? false,
        staleTime: Infinity
    });
}

export function useCompleteSyncOnboarding() {
    const queryClient = useQueryClient();
    const { set } = useSharedUxStorage('syncOnboardingCompleted');

    return useMutation<boolean, Error, void>({
        mutationFn: async () => {
            await set(true);
            return true;
        },
        onSuccess(next) {
            queryClient.setQueryData(syncOnboardingKeys.completed.toKey(), next);
        }
    });
}
