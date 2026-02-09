import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ConfirmationScreen } from '@mobile/screens/ConfirmationScreen';
import { SendAssetModal } from '@mobile/screens/SendAssetModal';

export const SendStack = createNativeStackNavigator({
    initialRouteName: 'SendAssetModal',
    screens: {
        SendAssetModal: SendAssetModal,
        ConfirmationModal: ConfirmationScreen
    },
    screenOptions: {
        headerShown: false
    }
});
