import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { HistoryScreen } from '@mobile/screens/HistoryScreen';
import { HomeScreen } from '@mobile/screens/HomeScreen';

export const TabsNavigator = createBottomTabNavigator({
    screens: {
        HomeScreen: {
            screen: HomeScreen
        },
        HistoryScreen: {
            screen: HistoryScreen
        }
    },
    screenOptions: {
        lazy: false,
        headerShown: false
    }
});
