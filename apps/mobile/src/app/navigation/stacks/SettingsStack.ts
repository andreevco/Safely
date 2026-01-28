import { LanguageScreen } from '@mobile/screens/LanguageScreen';
import { NotificationsScreen } from '@mobile/screens/NotificationsScreen';
import { SecurityScreen } from '@mobile/screens/SecurityScreen';
import { SettingsScreen } from '@mobile/screens/SettingsScreen';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

export const SettingsStack = createNativeStackNavigator({
    initialRouteName: 'SettingsRootModal',
    screens: {
        SettingsRootModal: SettingsScreen,
        LanguageModal: LanguageScreen,
        NotificationsModal: NotificationsScreen,
        SecurityModal: SecurityScreen
    },
    screenOptions: {
        headerShown: false
    }
});
