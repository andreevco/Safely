import { HomeScreen } from '@mobile/screens/HomeScreen';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

export const TabsNavigator = createBottomTabNavigator({
    screens: {
        HomeScreen: {
            screen: HomeScreen
        },
        HistoryScreen: {
            screen: HomeScreen
        }
    },
    screenOptions: {
        lazy: false,
        headerShown: false
    }
});
