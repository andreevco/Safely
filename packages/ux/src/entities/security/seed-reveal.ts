import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAppContext, useActiveAccountSyncedStorage, useSuspenseQuery } from '../../shared';
import { SeedRevealInfo } from '../../shared/storage/account/synced/schemas';
import { useActiveAccountQueryKey } from '../account';

export function useLastSeedRevealedAtQuery() {
    const accountQueryKey = useActiveAccountQueryKey();
    const { get } = useActiveAccountSyncedStorage('lastSeedRevealedAt');

    return useSuspenseQuery({
        queryKey: accountQueryKey.lastSeedRevealedAt.toKey(),
        queryFn: get,
        staleTime: Infinity
    });
}

export function useSeedRevealInfo(): SeedRevealInfo | null {
    const data = useLastSeedRevealedAtQuery().data;

    if (data === null || data === undefined) {
        return null;
    }

    if (typeof data === 'number') {
        return { timestamp: data, deviceName: 'Unknown device' };
    }

    return data;
}

export function useRecordSeedReveal() {
    const client = useQueryClient();
    const { deviceInfo } = useAppContext();
    const accountQueryKey = useActiveAccountQueryKey();
    const { get, set } = useActiveAccountSyncedStorage('lastSeedRevealedAt');

    return useMutation({
        async mutationFn() {
            const existing = await get();
            if (existing !== null && existing !== undefined) {
                return;
            }

            await set({
                timestamp: Date.now(),
                deviceName: deviceInfo.name
            });

            await client.invalidateQueries({
                queryKey: accountQueryKey.lastSeedRevealedAt.toKey()
            });
        }
    });
}
