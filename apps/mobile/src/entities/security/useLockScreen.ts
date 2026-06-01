import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useSuspenseQuery } from '@safely/ux';

import { useMobileLayerRegularStorage } from '@mobile/shared/storage';

import { lockScreenKeys } from './keys';

export function useLockScreenQuery() {
    const { get: storageGet } = useMobileLayerRegularStorage('lockScreenEnabled');

    return useSuspenseQuery({
        queryKey: lockScreenKeys.state.toKey(),
        queryFn: async () => {
            const value = await storageGet();

            return value ?? false;
        },
        staleTime: Infinity
    });
}

export function useSetLockScreenEnabled() {
    const queryClient = useQueryClient();
    const { set: storageSet } = useMobileLayerRegularStorage('lockScreenEnabled');

    return useMutation({
        mutationFn: async (enabled: boolean) => {
            await storageSet(enabled);
        },
        async onSuccess() {
            await queryClient.invalidateQueries({ queryKey: lockScreenKeys.state.toKey() });
        }
    });
}
