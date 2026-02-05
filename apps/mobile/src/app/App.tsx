import { MockTempWalletProvider } from '@mobile/app/MockTempWalletProvider';
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

const persister = createPersister(createMMKVTreeStorage('persister').storage);

export const App = () => {
    const { theme } = useUnistyles();

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
                                <MockTempWalletProvider>
                                    <Navigation
                                        onReady={() => SplashScreen.hideAsync()}
                                        theme={NavigationTheme}
                                    />

                                    <ToastProvider />
                                </MockTempWalletProvider>
                            </AppContextProvider>
                        </ToastServiceProvider>
                    </QueryProvider>
                </KeyboardProvider>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
};
