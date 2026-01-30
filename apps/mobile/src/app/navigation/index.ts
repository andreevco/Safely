import { CurrencyScreen } from '@mobile/screens/CurrencyScreen';
import { CustomizeWalletModal } from '@mobile/screens/CustomizeWalletModal';
import { HomeScreen } from '@mobile/screens/HomeScreen';
import { HomeSheet } from '@mobile/screens/HomeScreen/screens';
import { PasscodeModal } from '@mobile/screens/PasscodeModal';
import { RecoveryConfirmSheet, RecoveryPhraseSheet } from '@mobile/screens/SecurityScreen/screens';
import { createStaticNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { SettingsStack } from './stacks/SettingsStack';
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
                HomeModal: HomeScreen,
                SettingsModal: SettingsStack,
                CurrencyModal: CurrencyScreen,
                RecoveryPhraseModal: RecoveryPhraseSheet,
                CustomizeWalletModal: CustomizeWalletModal,
                PasscodeModal: PasscodeModal
            },
            screenOptions: {
                presentation: 'modal'
            }
        },
        Sheets: {
            screens: {
                HomeSheet: HomeSheet,
                RecoveryConfirmSheet: RecoveryConfirmSheet
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
