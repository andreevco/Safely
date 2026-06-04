import { focusManager, onlineManager } from '@tanstack/react-query';
import * as Network from 'expo-network';
import { AppState, Platform, type AppStateStatus } from 'react-native';

export function setupTanstackQueryManagers(): void {
    onlineManager.setEventListener(setOnline => {
        void Network.getNetworkStateAsync()
            .then(state => setOnline(Boolean(state.isConnected)))
            .catch(() => setOnline(true));

        const subscription = Network.addNetworkStateListener(state => {
            setOnline(Boolean(state.isConnected));
        });

        return () => subscription.remove();
    });

    if (Platform.OS === 'web') return;

    focusManager.setEventListener(setFocused => {
        const onAppStateChange = (status: AppStateStatus) => {
            setFocused(status === 'active');
        };

        const subscription = AppState.addEventListener('change', onAppStateChange);

        return () => subscription.remove();
    });
}
