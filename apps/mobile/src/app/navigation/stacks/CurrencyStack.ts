import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AmountDisplayScreen } from '@mobile/screens/AmountDisplayScreen';
import { CurrencyScreen } from '@mobile/screens/CurrencyScreen';

export const CurrencyStack = createNativeStackNavigator({
    initialRouteName: 'CurrencyRootModal',
    screens: {
        CurrencyRootModal: CurrencyScreen,
        AmountDisplayModal: AmountDisplayScreen
    },
    screenOptions: {
        headerShown: false
    }
});
