import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AddressBookModal } from '@mobile/screens/AddressBookModal';
import { DevToolsLogsScreen } from '@mobile/screens/DevToolsLogsScreen';
import { DevToolsScreen } from '@mobile/screens/DevToolsScreen';
import { DevToolsXpubScreen } from '@mobile/screens/DevToolsXpubScreen';
import { LanguageScreen } from '@mobile/screens/LanguageScreen';
import { LogSandboxScreen } from '@mobile/screens/LogSandboxScreen';
import { NewContactModal } from '@mobile/screens/NewContactModal';
import { ConfirmDeleteContactSheet } from '@mobile/screens/NewContactModal/screens/ConfirmDeleteContactSheet';
import { NotificationsScreen } from '@mobile/screens/NotificationsScreen';
import { SecurityScreen } from '@mobile/screens/SecurityScreen';
import { AccountProtectedModal, ProtectAccountModal } from '@mobile/screens/SecurityScreen/screens';
import { SettingsScreen } from '@mobile/screens/SettingsScreen';

export const SettingsStack = createNativeStackNavigator({
    initialRouteName: 'SettingsRootModal',
    groups: {
        Screens: {
            screens: {
                SettingsRootModal: SettingsScreen,
                LanguageModal: LanguageScreen,
                NotificationsModal: NotificationsScreen,
                SecurityModal: SecurityScreen,
                ProtectAccountModal: ProtectAccountModal,
                AccountProtectedModal: AccountProtectedModal,
                LogSandboxModal: LogSandboxScreen,
                AddressBookModal: AddressBookModal,
                NewContactModal: NewContactModal,
                DevToolsModal: DevToolsScreen,
                DevToolsXpubModal: DevToolsXpubScreen,
                DevToolsLogsModal: DevToolsLogsScreen
            }
        },
        Sheets: {
            screens: {
                ConfirmDeleteContactSheet: ConfirmDeleteContactSheet
            },
            screenOptions: {
                animationDuration: 0,
                presentation: 'transparentModal',
                animation: 'none',
                contentStyle: {
                    backgroundColor: 'transparent'
                }
            }
        }
    },
    screenOptions: {
        headerShown: false
    }
});
