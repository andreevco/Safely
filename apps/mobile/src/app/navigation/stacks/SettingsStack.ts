import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { DevToolsLogsScreen } from '@mobile/screens/DevToolsLogsScreen';
import { DevToolsScreen } from '@mobile/screens/DevToolsScreen';
import { DevToolsXpubScreen } from '@mobile/screens/DevToolsXpubScreen';
import { LanguageScreen } from '@mobile/screens/LanguageScreen';
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
        DevToolsModal: DevToolsScreen,
        DevToolsXpubModal: DevToolsXpubScreen,
        DevToolsLogsModal: DevToolsLogsScreen
    },
    screenOptions: {
        headerShown: false
    }
});
