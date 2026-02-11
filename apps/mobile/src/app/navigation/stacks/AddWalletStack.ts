import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AddWalletScreen } from '@mobile/screens/AddWalletModal';
import { CustomizeWalletModal } from '@mobile/screens/CustomizeWalletModal';
import { ImportWalletScreen } from '@mobile/screens/ImportWalletScreen';

export const AddWalletStack = createNativeStackNavigator({
    initialRouteName: 'AddWalletRootModal',
    screens: {
        AddWalletRootModal: AddWalletScreen,
        ImportWalletModal: ImportWalletScreen,
        CustomizeWalletModal: CustomizeWalletModal
    },
    screenOptions: {
        headerShown: false
    }
});
