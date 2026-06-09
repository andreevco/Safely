import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { LedgerDiscoveryScreen } from '@mobile/screens/LedgerDiscoveryScreen';
import { LedgerImportAccountsScreen } from '@mobile/screens/LedgerImportAccountsScreen';
import { LedgerPairingScreen } from '@mobile/screens/LedgerPairingScreen';
import { LedgerPairingSuccessScreen } from '@mobile/screens/LedgerPairingSuccessScreen';

export const LedgerFlow = createNativeStackNavigator({
    initialRouteName: 'LedgerDiscoveryModal',
    screens: {
        LedgerDiscoveryModal: LedgerDiscoveryScreen,
        LedgerPairingModal: LedgerPairingScreen,
        LedgerPairingSuccessModal: LedgerPairingSuccessScreen,
        LedgerImportAccountsModal: LedgerImportAccountsScreen
    },
    screenOptions: {
        headerShown: false
    }
});
