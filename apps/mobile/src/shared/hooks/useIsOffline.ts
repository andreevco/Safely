import { getNetworkStateAsync } from 'expo-network';
import { useEffect, useState } from 'react';

const POLL_INTERVAL_MS = 3000;

export function useIsOffline(): boolean {
    const [isOffline, setIsOffline] = useState(false);

    useEffect(() => {
        let isCancelled = false;

        const check = () => {
            getNetworkStateAsync()
                .then(state => {
                    if (!isCancelled) {
                        setIsOffline(state.isConnected === false);
                    }
                })
                .catch(() => undefined);
        };

        check();
        const intervalId = setInterval(check, POLL_INTERVAL_MS);

        return () => {
            isCancelled = true;
            clearInterval(intervalId);
        };
    }, []);

    return isOffline;
}
