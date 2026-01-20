import { DarkTheme, Theme } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import { useMemo } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useUnistyles } from 'react-native-unistyles';

import Navigation from './navigation';

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
        <SafeAreaProvider>
            <Navigation onReady={() => SplashScreen.hideAsync()} theme={NavigationTheme} />
        </SafeAreaProvider>
    );
};
