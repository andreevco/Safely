import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BottomTabBar, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import i18next from 'i18next';
import { useEffect, useState } from 'react';

import { useHasPortfolio } from '@safely/ux';

import { SafelyBetaScreen } from '@mobile/screens/SafelyBetaScreen';
import { Home28, Icon, InformationCircle28 } from '@mobile/shared/ui/Icon';

import { HomeStack } from '../stacks/HomeStack';

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
        HomeStack: {
            screen: HomeStack,
            options: () => ({
                title: i18next.t('tabs.home'),
                tabBarIcon: ({ color }) => <Icon icon={Home28} style={{ tintColor: color }} />
            })
        },
        SafelyBetaScreen: {
            screen: SafelyBetaScreen,
            linking: {
                path: 'beta'
            },
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
