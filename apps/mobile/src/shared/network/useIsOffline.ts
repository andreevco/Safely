import { useQuery } from '@tanstack/react-query';
import { getNetworkStateAsync } from 'expo-network';

import { networkKeys } from './keys';

const POLL_INTERVAL_MS = 3000;

export function useIsOffline(): boolean {
    const { data } = useQuery({
        queryKey: networkKeys.isOffline.toKey(),
        queryFn: async () => {
            const state = await getNetworkStateAsync();

            return state.isConnected === false || state.isInternetReachable === false;
        },
        refetchInterval: POLL_INTERVAL_MS,
        initialData: false
    });

    return data;
}
