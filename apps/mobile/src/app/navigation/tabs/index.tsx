import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import i18next from 'i18next';

import { HistoryScreen } from '@mobile/screens/HistoryScreen';
import { HomeScreen } from '@mobile/screens/HomeScreen';
import { Bolt28, Home28, Icon } from '@mobile/shared/ui/Icon';

export const TabsNavigator = createBottomTabNavigator({
    screens: {
        HomeScreen: {
            screen: HomeScreen,
            options: () => ({
                title: i18next.t('tabs.home'),
                tabBarIcon: ({ color }) => <Icon icon={Home28} style={{ tintColor: color }} />
            })
        },
        HistoryScreen: {
            screen: HistoryScreen,
            options: () => ({
                title: i18next.t('tabs.history'),
                tabBarIcon: ({ color }) => <Icon icon={Bolt28} style={{ tintColor: color }} />
            })
        }
    },
    screenOptions: {
        lazy: false,
        headerShown: false,
        tabBarStyle: {
            paddingHorizontal: 16,
            marginBottom: 8
        }
    }
});
