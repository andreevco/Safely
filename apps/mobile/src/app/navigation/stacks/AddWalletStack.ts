import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AddWalletScreen } from '@mobile/screens/AddWalletModal';
import { AddWatchOnlyScreen } from '@mobile/screens/AddWatchOnlyScreen';
import { BluetoothAccessRequiredScreen } from '@mobile/screens/BluetoothAccessRequiredScreen';
import { ConnectLedgerScreen } from '@mobile/screens/ConnectLedgerScreen';
import { CustomizeWalletModal } from '@mobile/screens/CustomizeWalletModal';
import { ImportWalletScreen } from '@mobile/screens/ImportWalletScreen';
import { LedgerDiscoveryScreen } from '@mobile/screens/LedgerDiscoveryScreen';
import { LedgerImportAccountsScreen } from '@mobile/screens/LedgerImportAccountsScreen';
import { LedgerPairingScreen } from '@mobile/screens/LedgerPairingScreen';
import { LedgerPairingSuccessScreen } from '@mobile/screens/LedgerPairingSuccessScreen';
import { WalletAlreadyAddedScreen } from '@mobile/screens/WalletAlreadyAddedScreen';

export const AddWalletStack = createNativeStackNavigator({
    initialRouteName: 'AddWalletRootModal',
    screens: {
        AddWalletRootModal: AddWalletScreen,
        ImportWalletModal: ImportWalletScreen,
        AddWatchOnlyModal: AddWatchOnlyScreen,
        ConnectLedgerModal: ConnectLedgerScreen,
        BluetoothAccessRequiredModal: BluetoothAccessRequiredScreen,
        LedgerDiscoveryModal: LedgerDiscoveryScreen,
        LedgerPairingModal: LedgerPairingScreen,
        LedgerPairingSuccessModal: LedgerPairingSuccessScreen,
        LedgerImportAccountsModal: LedgerImportAccountsScreen,
        CustomizeWalletModal: CustomizeWalletModal,
        WalletAlreadyAddedModal: WalletAlreadyAddedScreen
    },
    screenOptions: {
        headerShown: false
    }
});
