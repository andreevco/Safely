import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { LedgerDiscoveryScreen } from '@mobile/screens/LedgerDiscoveryScreen';
import { LedgerPairingScreen } from '@mobile/screens/LedgerPairingScreen';
import { LedgerPairingSuccessScreen } from '@mobile/screens/LedgerPairingSuccessScreen';
import { LedgerPairingUnsuccessScreen } from '@mobile/screens/LedgerPairingUnsuccessScreen';
import { OnboardingLedgerImportScreen } from '@mobile/screens/OnboardingLedgerImportScreen';

const onboardingLayout = { layout: 'screen' } as const;

export const OnboardingLedgerFlow = createNativeStackNavigator({
    initialRouteName: 'LedgerDiscoveryModal',
    screens: {
        LedgerDiscoveryModal: { screen: LedgerDiscoveryScreen, initialParams: onboardingLayout },
        LedgerPairingModal: { screen: LedgerPairingScreen, initialParams: onboardingLayout },
        LedgerPairingSuccessModal: {
            screen: LedgerPairingSuccessScreen,
            initialParams: onboardingLayout
        },
        LedgerPairingUnsuccessModal: {
            screen: LedgerPairingUnsuccessScreen,
            initialParams: onboardingLayout
        },
        LedgerImportAccountsModal: {
            screen: OnboardingLedgerImportScreen,
            initialParams: onboardingLayout
        }
    },
    screenOptions: {
        headerShown: false,
        animation: 'fade'
    }
});
