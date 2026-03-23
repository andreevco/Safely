import {
    BottomTabBar,
    BottomTabBarProps,
    createBottomTabNavigator
} from '@react-navigation/bottom-tabs';
import i18next from 'i18next';
import { useEffect, useState } from 'react';

import { useHasPortfolio } from '@safely/ux';

import { HistoryScreen } from '@mobile/screens/HistoryScreen';
import { HomeScreen } from '@mobile/screens/HomeScreen';
import { Bolt28, Home28, Icon } from '@mobile/shared/ui/Icon';

const TabBar = (props: BottomTabBarProps) => {
    const hasPortfolio = useHasPortfolio();
    // Defer BottomTabBar render to avoid setState in onLayout before mount
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!hasPortfolio || !mounted) {
        return null;
    }

    return <BottomTabBar {...props} />;
};

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
    },
    tabBar: props => <TabBar {...props} />
});
