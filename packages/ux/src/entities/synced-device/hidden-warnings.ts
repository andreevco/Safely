import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { syncedDeviceKeys } from './keys';
import { useSharedUxStorage } from '../../shared';

const HIDE_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

export function useIsDeviceWarningHidden(ikPubHex: string): boolean {
    const { get } = useSharedUxStorage('hiddenDeviceWarnings');

    const { data } = useQuery({
        queryKey: syncedDeviceKeys.hiddenWarnings.toKey(),
        queryFn: async () => (await get()) ?? {},
        staleTime: Infinity
    });

    const hiddenUntil = data?.[ikPubHex];

    return hiddenUntil !== undefined && hiddenUntil > Date.now();
}

export function useHideDeviceWarning() {
    const queryClient = useQueryClient();
    const { get, set } = useSharedUxStorage('hiddenDeviceWarnings');

    return useMutation<Record<string, number>, Error, string>({
        async mutationFn(ikPubHex) {
            const current = (await get()) ?? {};
            const next = { ...current, [ikPubHex]: Date.now() + HIDE_DURATION_MS };

            await set(next);

            return next;
        },
        onSuccess(next) {
            queryClient.setQueryData(syncedDeviceKeys.hiddenWarnings.toKey(), next);
        }
    });
}
