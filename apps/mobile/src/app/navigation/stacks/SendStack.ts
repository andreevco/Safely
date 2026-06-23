import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { BluetoothAccessRequiredScreen } from '@mobile/screens/BluetoothAccessRequiredScreen';
import { BluetoothDisabledScreen } from '@mobile/screens/BluetoothDisabledScreen';
import { ConfirmationScreen } from '@mobile/screens/ConfirmationScreen';
import { SendAssetModal } from '@mobile/screens/SendAssetModal';

export const SendStack = createNativeStackNavigator({
    initialRouteName: 'SendFormModal',
    screens: {
        SendFormModal: SendAssetModal,
        ConfirmationModal: ConfirmationScreen,
        BluetoothAccessRequiredModal: BluetoothAccessRequiredScreen,
        BluetoothDisabledModal: BluetoothDisabledScreen
    },
    screenOptions: {
        headerShown: false
    }
});
