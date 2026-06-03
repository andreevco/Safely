import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AddWalletScreen } from '@mobile/screens/AddWalletModal';
import { AddWatchOnlyScreen } from '@mobile/screens/AddWatchOnlyScreen';
import { ConnectLedgerScreen } from '@mobile/screens/ConnectLedgerScreen';
import { CustomizeWalletModal } from '@mobile/screens/CustomizeWalletModal';
import { ImportWalletScreen } from '@mobile/screens/ImportWalletScreen';
import { WalletAlreadyAddedScreen } from '@mobile/screens/WalletAlreadyAddedScreen';

export const AddWalletStack = createNativeStackNavigator({
    initialRouteName: 'AddWalletRootModal',
    screens: {
        AddWalletRootModal: AddWalletScreen,
        ImportWalletModal: ImportWalletScreen,
        AddWatchOnlyModal: AddWatchOnlyScreen,
        ConnectLedgerModal: ConnectLedgerScreen,
        CustomizeWalletModal: CustomizeWalletModal,
        WalletAlreadyAddedModal: WalletAlreadyAddedScreen
    },
    screenOptions: {
        headerShown: false
    }
});
