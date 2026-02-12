import { NavigationContainerProps } from '@react-navigation/native';
import { createMMKV } from 'react-native-mmkv';

import { TreeStorage } from '@safely/core';

export function useInitialNavigationState(): NavigationContainerProps['initialState'] {
    const hasPortfolio =
        createMMKV({ id: 'app' }).getString(
            TreeStorage.buildKey(['mock-accounts'], 'portfolios')
        ) !== undefined;

    const hasPasscode =
        createMMKV({ id: 'keychain' }).getString(
            TreeStorage.buildKey(['unstructured'], 'passcode')
        ) !== undefined;

    if (!hasPasscode || !hasPortfolio) {
        return {
            routes: [{ name: 'WelcomeScreen' as const }]
        };
    }

    return undefined;
}
