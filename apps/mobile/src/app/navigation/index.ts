import { AddWalletModal } from '@mobile/screens/AddWalletModal';
import { CurrencyScreen } from '@mobile/screens/CurrencyScreen';
import { CustomizeWalletModal } from '@mobile/screens/CustomizeWalletModal';
import { PasscodeModal } from '@mobile/screens/PasscodeModal';
import { QRScanModal } from '@mobile/screens/QRScanModal';
import { ReceiveAssetModal } from '@mobile/screens/ReceiveAssetModal';
import { RecoveryConfirmSheet, RecoveryPhraseSheet } from '@mobile/screens/SecurityScreen/screens';
import { SelectAccountModal } from '@mobile/screens/SelectAccountModal';
import { TransactionScreen } from '@mobile/screens/TransactionScreen';
import { createStaticNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { SendStack } from './stacks/SendStack';
import { SettingsStack } from './stacks/SettingsStack';
import { TabsNavigator } from './tabs';

export const RootStack = createNativeStackNavigator({
    initialRouteName: 'TabsNavigator',
    groups: {
        Screens: {
            screens: {
                TabsNavigator: TabsNavigator,
                TransactionScreen: TransactionScreen
            }
        },
        Modals: {
            screens: {
                SettingsModal: SettingsStack,
                CurrencyModal: CurrencyScreen,
                RecoveryPhraseModal: RecoveryPhraseSheet,
                CustomizeWalletModal: CustomizeWalletModal,
                PasscodeModal: PasscodeModal,
                QRScanModal: QRScanModal,
                AddWalletModal: AddWalletModal,
                SelectAccountModal: SelectAccountModal,
                ReceiveAssetModal: ReceiveAssetModal,
                SendAssetModal: SendStack
            },
            screenOptions: {
                presentation: 'modal'
            }
        },
        Sheets: {
            screens: {
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
