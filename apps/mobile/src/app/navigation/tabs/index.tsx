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
import { SafelyBetaScreen } from '@mobile/screens/SafelyBetaScreen';
import { Bolt28, Home28, Icon, InformationCircle28 } from '@mobile/shared/ui/Icon';

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
        },
        SafelyBetaScreen: {
            screen: SafelyBetaScreen,
            options: () => ({
                title: i18next.t('tabs.about'),
                tabBarIcon: ({ color }) => (
                    <Icon icon={InformationCircle28} style={{ tintColor: color }} />
                )
            })
        }
    },
    screenOptions: {
        lazy: false,
        headerShown: false,
        tabBarStyle: {
            paddingHorizontal: 16,
            marginBottom: 8
        },
        tabBarLabelStyle: {
            fontSize: 11,
            lineHeight: 16,
            fontWeight: '600'
        }
    },
    tabBar: props => <TabBar {...props} />
});

const tabScreenNames = Object.keys(TabsNavigator.config.screens);

export const tabsInitialState = {
    index: 0,
    routes: tabScreenNames.map(name => ({ name }))
};
