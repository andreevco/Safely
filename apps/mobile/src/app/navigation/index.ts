import { AccountCreatedScreen } from '@mobile/screens/AccountCreatedScreen';
import { BiometryScreen } from '@mobile/screens/BiometryScreen';
import { ChangePasscodeScreen } from '@mobile/screens/ChangePasscodeScreen';
import { CurrencyScreen } from '@mobile/screens/CurrencyScreen';
import { OnboardingNotificationsScreen } from '@mobile/screens/OnboardingNotificationsScreen';
import { OnboardingPasscodeScreen } from '@mobile/screens/OnboardingPasscodeScreen';
import { PasscodeVerificationScreen } from '@mobile/screens/PasscodeVerificationScreen';
import { QRScanModal } from '@mobile/screens/QRScanModal';
import { ReceiveAssetModal } from '@mobile/screens/ReceiveAssetModal';
import { RecoveryConfirmSheet, RecoveryPhraseSheet } from '@mobile/screens/SecurityScreen/screens';
import { SelectAccountModal } from '@mobile/screens/SelectAccountModal';
import { WelcomeScreen } from '@mobile/screens/WelcomeScreen';
import { createStaticNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AddWalletStack } from './stacks/AddWalletStack';
import { SendStack } from './stacks/SendStack';
import { SettingsStack } from './stacks/SettingsStack';
import { TabsNavigator } from './tabs';

export const RootStack = createNativeStackNavigator({
    initialRouteName: 'TabsNavigator',
    groups: {
        Onboarding: {
            screens: {
                WelcomeScreen: WelcomeScreen,
                OnboardingPasscodeScreen: OnboardingPasscodeScreen,
                BiometryScreen: BiometryScreen,
                OnboardingNotificationsScreen: OnboardingNotificationsScreen,
                AccountCreatedScreen: AccountCreatedScreen
            }
        },
        Screens: {
            screens: {
                TabsNavigator: TabsNavigator
            }
        },
        Modals: {
            screens: {
                SettingsModal: SettingsStack,
                CurrencyModal: CurrencyScreen,
                RecoveryPhraseModal: RecoveryPhraseSheet,
                PasscodeVerificationModal: PasscodeVerificationScreen,
                ChangePasscodeModal: ChangePasscodeScreen,
                QRScanModal: QRScanModal,
                AddWalletModal: AddWalletStack,
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
