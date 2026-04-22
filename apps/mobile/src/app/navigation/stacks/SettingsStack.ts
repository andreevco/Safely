import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { LanguageScreen } from '@mobile/screens/LanguageScreen';
import { LogSandboxScreen } from '@mobile/screens/LogSandboxScreen';
import { NotificationsScreen } from '@mobile/screens/NotificationsScreen';
import { SecurityScreen } from '@mobile/screens/SecurityScreen';
import { AccountProtectedModal, ProtectAccountModal } from '@mobile/screens/SecurityScreen/screens';
import { SettingsScreen } from '@mobile/screens/SettingsScreen';

export const SettingsStack = createNativeStackNavigator({
    initialRouteName: 'SettingsRootModal',
    screens: {
        SettingsRootModal: SettingsScreen,
        LanguageModal: LanguageScreen,
        NotificationsModal: NotificationsScreen,
        SecurityModal: SecurityScreen,
        ProtectAccountModal: ProtectAccountModal,
        AccountProtectedModal: AccountProtectedModal,
        LogSandboxModal: LogSandboxScreen
    },
    screenOptions: {
        headerShown: false
    }
});
