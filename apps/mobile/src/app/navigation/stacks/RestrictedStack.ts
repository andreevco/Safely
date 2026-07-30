import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { DestructiveConfirmSheet } from '@mobile/screens/DestructiveConfirmSheet';
import { RestrictedRecoveryScreen } from '@mobile/screens/RestrictedRecoveryScreen';
import { RestrictedScreen } from '@mobile/screens/RestrictedScreen';
import { RecoveryConfirmSheet, RecoveryPhraseSheet } from '@mobile/screens/SecurityScreen/screens';
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
                RecoveryPhraseModal: RecoveryPhraseSheet,
                SelectAccountSelectorModal: SelectAccountSelectorModal
            },
            screenOptions: {
                presentation: 'modal'
            }
        },
        Sheets: {
            screens: {
                RecoveryConfirmSheet: RecoveryConfirmSheet,
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
