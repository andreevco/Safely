import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { SignInScreen } from '@mobile/screens/SignInScreen';
import { SignInSuccessScreen } from '@mobile/screens/SignInSuccessScreen';

export const SignInStack = createNativeStackNavigator({
    initialRouteName: 'SignInQRModal',
    screens: {
        SignInQRModal: SignInScreen,
        SignInSuccessModal: SignInSuccessScreen
    },
    screenOptions: {
        headerShown: false
    }
});
