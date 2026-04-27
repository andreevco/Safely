import { useQueryClient } from '@tanstack/react-query';
import z from 'zod';

import { useMutation, useSharedUnstructuredStorage, useSuspenseQuery } from '@safely/ux';

import { StorageKey } from '@mobile/shared/constants';

import { lockScreenKeys } from './keys';

const sLockScreenEnabled = z.boolean();

export function useLockScreenQuery() {
    const { get: storageGet } = useSharedUnstructuredStorage(
        StorageKey.LOCK_SCREEN_ENABLED,
        sLockScreenEnabled
    );

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
    const { set: storageSet } = useSharedUnstructuredStorage(
        StorageKey.LOCK_SCREEN_ENABLED,
        sLockScreenEnabled
    );

    return useMutation({
        mutationFn: async (enabled: boolean) => {
            await storageSet(enabled);
        },
        async onSuccess() {
            await queryClient.invalidateQueries({ queryKey: lockScreenKeys.state.toKey() });
        }
    });
}
