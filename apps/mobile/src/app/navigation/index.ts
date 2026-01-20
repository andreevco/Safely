import { HomeScreen } from '@mobile/screens/HomeScreen';
import { HomeSheet } from '@mobile/screens/HomeScreen/screens';
import { createStaticNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { TabsNavigator } from './tabs';

export const RootStack = createNativeStackNavigator({
    initialRouteName: 'TabsNavigator',
    groups: {
        Screens: {
            screens: {
                TabsNavigator: TabsNavigator
            }
        },
        Modals: {
            screens: {
                HomeModal: HomeScreen
            },
            screenOptions: {
                presentation: 'modal'
            }
        },
        Sheets: {
            screens: {
                HomeSheet: HomeSheet
            },
            screenOptions: {
                animationDuration: 0,
                presentation: 'transparentModal',
                animation: 'none',
                contentStyle: {
                    backgroundColor: 'transparent'
                }
            }
        }
    },
    screenOptions: {
        headerShown: false
    }
});

const Navigation = createStaticNavigation(RootStack);

export default Navigation;
