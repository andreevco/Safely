import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { HistoryScreen } from '@mobile/screens/HistoryScreen';
import { HomeScreen } from '@mobile/screens/HomeScreen';

export const HomeStack = createNativeStackNavigator({
    initialRouteName: 'HomeScreen',
    screens: {
        HomeScreen: HomeScreen,
        HistoryScreen: HistoryScreen
    },
    screenOptions: {
        headerShown: false
    }
});
