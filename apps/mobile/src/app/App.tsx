import { mmkvStorage } from '@mobile/shared/storage/mmkv';
import { DarkTheme, Theme } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import i18next from 'i18next';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useUnistyles } from 'react-native-unistyles';

import { AppContext, createPersister, IAppContext, QueryProvider } from '@safely/ux';

import Navigation from './navigation';

const persister = createPersister(mmkvStorage);

const Loader = () => (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
    </View>
);

export const App = () => {
    const { theme } = useUnistyles();
    const { t } = useTranslation();

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

    const appContext = useMemo<IAppContext>(
        () => ({
            i18n: {
                language: i18next.language,
                t
            },
            sdk: {}, // TODO: Implement IAppSdk
            version: '1.0.0',
            build: 'ios',
            toast: {
                // TODO: Implement toast service
                show: () => {},
                hide: () => {}
            }
        }),
        [t]
    );

    return (
        <GestureHandlerRootView>
            <SafeAreaProvider>
                <QueryProvider persister={persister} loader={<Loader />}>
                    <AppContext value={appContext}>
                        <Navigation
                            onReady={() => SplashScreen.hideAsync()}
                            theme={NavigationTheme}
                        />
                    </AppContext>
                </QueryProvider>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
};
