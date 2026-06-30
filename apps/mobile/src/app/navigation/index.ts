import { createStaticNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AccountCreatedScreen } from '@mobile/screens/AccountCreatedScreen';
import { AddAccountSheet } from '@mobile/screens/AddAccountSheet';
import { BiometryScreen } from '@mobile/screens/BiometryScreen';
import { ChangePasscodeScreen } from '@mobile/screens/ChangePasscodeScreen';
import { ConnectToSignSheet } from '@mobile/screens/ConnectToSignSheet';
import { CurrencyScreen } from '@mobile/screens/CurrencyScreen';
import { CustomizeAccountModal } from '@mobile/screens/CustomizeAccountModal';
import { CustomizeWalletModal } from '@mobile/screens/CustomizeWalletModal';
import { DestructiveConfirmSheet } from '@mobile/screens/DestructiveConfirmSheet';
import { LockScreen } from '@mobile/screens/LockScreen';
import { NewContactModal } from '@mobile/screens/NewContactModal';
import { ConfirmDeleteContactSheet } from '@mobile/screens/NewContactModal/screens/ConfirmDeleteContactSheet';
import { OnboardingPasscodeScreen } from '@mobile/screens/OnboardingPasscodeScreen';
import { PasscodeVerificationScreen } from '@mobile/screens/PasscodeVerificationScreen';
import { PendingFundsSheet } from '@mobile/screens/PendingFundsSheet';
import { QRScanModal } from '@mobile/screens/QRScanModal';
import { ReceiveAssetModal } from '@mobile/screens/ReceiveAssetModal';
import { ReconnectDeviceModal } from '@mobile/screens/ReconnectDeviceModal';
import { RemoveWalletSheet } from '@mobile/screens/RemoveWalletSheet';
import {
    DisconnectDeviceSheet,
    RecoveryConfirmSheet,
    RecoveryPhraseSheet
} from '@mobile/screens/SecurityScreen/screens';
import { SelectAccountModal } from '@mobile/screens/SelectAccountModal';
import { SelectAccountSelectorModal } from '@mobile/screens/SelectAccountSelectorModal';
import { SignInScreen } from '@mobile/screens/SignInScreen';
import { SignInSuccessScreen } from '@mobile/screens/SignInSuccessScreen';
import { SignOutAccountSheet } from '@mobile/screens/SignOutAccountSheet';
import { TransactionScreen } from '@mobile/screens/TransactionScreen';
import { WatchOnlySheet } from '@mobile/screens/WatchOnlySheet';
import { WelcomeScreen } from '@mobile/screens/WelcomeScreen';

import { AddWalletStack } from './stacks/AddWalletStack';
import { SendStack } from './stacks/SendStack';
import { SettingsStack } from './stacks/SettingsStack';
import { SignInStack } from './stacks/SignInStack';
import { TabsNavigator } from './tabs';

export const RootStack = createNativeStackNavigator({
    initialRouteName: 'TabsNavigator',
    groups: {
        Onboarding: {
            screens: {
                WelcomeScreen: WelcomeScreen,
                OnboardingPasscodeScreen: OnboardingPasscodeScreen,
                BiometryScreen: BiometryScreen,
                AccountCreatedScreen: AccountCreatedScreen,
                SignInScreen: SignInScreen,
                SignInSuccessScreen: SignInSuccessScreen
            }
        },
        Screens: {
            screens: {
                TabsNavigator: {
                    screen: TabsNavigator,
                    linking: {
                        path: 'tab'
                    }
                },
                TransactionScreen: TransactionScreen,
                LockScreen: {
                    screen: LockScreen,
                    options: {
                        presentation: 'fullScreenModal',
                        gestureEnabled: false,
                        animation: 'fade' as const
                    }
                },
                PasscodeVerificationScreen: {
                    screen: PasscodeVerificationScreen,
                    options: {
                        presentation: 'fullScreenModal',
                        animation: 'fade',
                        animationDuration: 50
                    }
                },
                ChangePasscodeScreen: {
                    screen: ChangePasscodeScreen,
                    options: {
                        presentation: 'fullScreenModal',
                        animation: 'fade',
                        animationDuration: 50
                    }
                }
            }
        },
        Modals: {
            screens: {
                SettingsModal: SettingsStack,
                CurrencyModal: CurrencyScreen,
                RecoveryPhraseModal: RecoveryPhraseSheet,
                SignInModal: SignInStack,
                CustomizeAccountModal: CustomizeAccountModal,
                CustomizeWalletModal: CustomizeWalletModal,
                QRScanModal: QRScanModal,
                NewContactModal: NewContactModal,
                AddWalletModal: AddWalletStack,
                SelectAccountModal: SelectAccountModal,
                SelectAccountSelectorModal: SelectAccountSelectorModal,
                ReceiveAssetModal: ReceiveAssetModal,
                ReconnectDeviceModal: ReconnectDeviceModal,
                SendAssetModal: SendStack
            },
            screenOptions: {
                presentation: 'modal'
            }
        },
        Sheets: {
            screens: {
                AddAccountSheet: AddAccountSheet,
                RecoveryConfirmSheet: RecoveryConfirmSheet,
                DestructiveConfirmSheet: DestructiveConfirmSheet,
                DisconnectDeviceSheet: DisconnectDeviceSheet,
                RemoveWalletSheet: RemoveWalletSheet,
                SignOutAccountSheet: SignOutAccountSheet,
                WatchOnlySheet: WatchOnlySheet,
                PendingFundsSheet: PendingFundsSheet,
                ConfirmDeleteContactSheet: ConfirmDeleteContactSheet,
                ConnectToSignSheet: ConnectToSignSheet
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
