import * as Network from 'expo-network';
import { AppState, Platform, type AppStateStatus } from 'react-native';

import type { EventListeners } from '@safely/ux';

export function createTanstackEventListeners(): EventListeners {
    const eventListeners: EventListeners = {
        onlineManager: setOnline => {
            const checkOnline = () => {
                void Network.getNetworkStateAsync()
                    .then(state => setOnline(Boolean(state.isConnected)))
                    .catch(() => setOnline(true));
            };

            checkOnline();

            const onlineStatusPollingInterval = setInterval(checkOnline, 3000);

            return () => clearInterval(onlineStatusPollingInterval);
        }
    };

    if (Platform.OS !== 'web') {
        eventListeners.focusManager = setFocused => {
            const onAppStateChange = (status: AppStateStatus) => {
                setFocused(status === 'active');
            };

            const subscription = AppState.addEventListener('change', onAppStateChange);

            return () => subscription.remove();
        };
    }

    return eventListeners;
}
