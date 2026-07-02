import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { BluetoothAccessRequiredScreen } from '@mobile/screens/BluetoothAccessRequiredScreen';
import { BluetoothDisabledScreen } from '@mobile/screens/BluetoothDisabledScreen';
import { ConnectLedgerScreen } from '@mobile/screens/ConnectLedgerScreen';

import { OnboardingLedgerFlow } from './OnboardingLedgerFlow';

const onboardingLayout = { layout: 'screen' } as const;

export const OnboardingLedgerStack = createNativeStackNavigator({
    initialRouteName: 'ConnectLedgerModal',
    screens: {
        ConnectLedgerModal: { screen: ConnectLedgerScreen, initialParams: onboardingLayout },
        BluetoothAccessRequiredModal: {
            screen: BluetoothAccessRequiredScreen,
            initialParams: onboardingLayout
        },
        BluetoothDisabledModal: {
            screen: BluetoothDisabledScreen,
            initialParams: onboardingLayout
        },
        LedgerFlowModal: OnboardingLedgerFlow
    },
    screenOptions: {
        headerShown: false
    }
});
