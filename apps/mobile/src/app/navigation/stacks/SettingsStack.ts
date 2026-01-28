import { LanguageScreen } from '@mobile/screens/LanguageScreen';
import { SettingsScreen } from '@mobile/screens/SettingsScreen';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

export const SettingsStack = createNativeStackNavigator({
    initialRouteName: 'SettingsModal',
    screens: {
        SettingsModal: SettingsScreen,
        LanguageModal: LanguageScreen
    },
    screenOptions: {
        headerShown: false
    }
});
