import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { DestructiveConfirmSheet } from '@mobile/screens/DestructiveConfirmSheet';
import { RestrictedRecoveryScreen } from '@mobile/screens/RestrictedRecoveryScreen';
import { RestrictedScreen } from '@mobile/screens/RestrictedScreen';
import { SelectAccountSelectorModal } from '@mobile/screens/SelectAccountSelectorModal';

export const RestrictedStack = createNativeStackNavigator({
    initialRouteName: 'RestrictedScreen',
    groups: {
        Screens: {
            screens: {
                RestrictedScreen: RestrictedScreen,
                RestrictedRecoveryScreen: RestrictedRecoveryScreen
            }
        },
        Modals: {
            screens: {
                SelectAccountSelectorModal: SelectAccountSelectorModal
            },
            screenOptions: {
                presentation: 'modal'
            }
        },
        Sheets: {
            screens: {
                DestructiveConfirmSheet: DestructiveConfirmSheet
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
