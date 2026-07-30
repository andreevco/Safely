import type { Theme } from '@react-navigation/native';
import { DarkTheme } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { useEffect, useMemo } from 'react';
import { useUnistyles } from 'react-native-unistyles';

import { LedgerSessionProvider, SyncStorageProvider } from '@safely/ux';

import { LockScreenProvider } from '@mobile/entities/security';
import { BleManagerProvider } from '@mobile/features/ledger';

import Navigation from './navigation';
import { navigationRef } from './navigation/navigationRef';
import { useInitialNavigationState } from './navigation/useInitialNavigationState';
import { useRestrictionRedirect } from './navigation/useRestrictionRedirect';

export function AppNavigation() {
    const { theme } = useUnistyles();
    const initialState = useInitialNavigationState();

    useRestrictionRedirect();

    const NavigationTheme: Theme = useMemo(
        () => ({
            ...DarkTheme,
            colors: {
                primary: theme.colors.accent.accent,
                background: theme.colors.background.primary,
                card: theme.colors.background.primary,
                text: theme.colors.text.primary,
                border: theme.colors.other.hover,
                notification: theme.colors.accent.accent
            }
        }),
        [theme]
    );

    useEffect(() => {
        // It fixes animation white flickering on Android when animating between screens
        SystemUI.setBackgroundColorAsync(theme.colors.background.primary);
    }, [theme.colors.background.primary]);

    return (
        <LockScreenProvider>
            <BleManagerProvider>
                <LedgerSessionProvider
                    openConnectScreen={() => navigationRef.navigate('ConnectToSignSheet')}
                >
                    <SyncStorageProvider>
                        <Navigation
                            ref={navigationRef}
                            initialState={initialState}
                            onReady={() => SplashScreen.hideAsync()}
                            theme={NavigationTheme}
                            linking={{
                                enabled: true,
                                prefixes: [Linking.createURL('/')]
                            }}
                        />
                    </SyncStorageProvider>
                </LedgerSessionProvider>
            </BleManagerProvider>
        </LockScreenProvider>
    );
}
