import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AddWalletScreen } from '@mobile/screens/AddWalletModal';
import { AddWatchOnlyScreen } from '@mobile/screens/AddWatchOnlyScreen';
import { CustomizeWalletModal } from '@mobile/screens/CustomizeWalletModal';
import { ImportWalletScreen } from '@mobile/screens/ImportWalletScreen';
import { WalletAlreadyAddedScreen } from '@mobile/screens/WalletAlreadyAddedScreen';

export const AddWalletStack = createNativeStackNavigator({
    initialRouteName: 'AddWalletRootModal',
    screens: {
        AddWalletRootModal: AddWalletScreen,
        ImportWalletModal: ImportWalletScreen,
        AddWatchOnlyModal: AddWatchOnlyScreen,
        CustomizeWalletModal: CustomizeWalletModal,
        WalletAlreadyAddedModal: WalletAlreadyAddedScreen
    },
    screenOptions: {
        headerShown: false
    }
});
