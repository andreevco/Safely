import { HistoryScreen } from '@mobile/screens/HistoryScreen';
import { HomeScreen } from '@mobile/screens/HomeScreen';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

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
