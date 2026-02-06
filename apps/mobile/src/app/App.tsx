import { LoaderProvider } from '@mobile/shared/providers/loader';
import { ToastProvider, ToastServiceProvider } from '@mobile/shared/providers/toast';
import { createMMKVTreeStorage } from '@mobile/shared/storage/mmkv';
import { DarkTheme, Theme } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import { useMemo } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useUnistyles } from 'react-native-unistyles';

import { createPersister, QueryProvider } from '@safely/ux';

import { AppContextProvider } from './AppContext';
import Navigation from './navigation';
import { navigationRef } from './navigation/navigationRef';
import { useInitialNavigationState } from './navigation/useInitialNavigationState';

const persister = createPersister(createMMKVTreeStorage('persister').storage);

export const App = () => {
    const { theme } = useUnistyles();
    const initialState = useInitialNavigationState();

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

    return (
        <GestureHandlerRootView>
            <SafeAreaProvider>
                <KeyboardProvider>
                    <QueryProvider persister={persister}>
                        <ToastServiceProvider>
                            <AppContextProvider>
                                <LoaderProvider>
                                    <Navigation
                                        ref={navigationRef}
                                        initialState={initialState}
                                        onReady={() => SplashScreen.hideAsync()}
                                        theme={NavigationTheme}
                                    />
                                    <ToastProvider />
                                </LoaderProvider>
                            </AppContextProvider>
                        </ToastServiceProvider>
                    </QueryProvider>
                </KeyboardProvider>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
};
