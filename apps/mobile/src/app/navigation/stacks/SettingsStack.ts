import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AddressBookModal } from '@mobile/screens/AddressBookModal';
import { DevToolsConfigScreen } from '@mobile/screens/DevToolsConfigScreen';
import { DevToolsLogsScreen } from '@mobile/screens/DevToolsLogsScreen';
import { DevToolsScreen } from '@mobile/screens/DevToolsScreen';
import { DevToolsXpubScreen } from '@mobile/screens/DevToolsXpubScreen';
import { LanguageScreen } from '@mobile/screens/LanguageScreen';
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
                SecurityModal: SecurityScreen,
                ProtectAccountModal: ProtectAccountModal,
                AccountProtectedModal: AccountProtectedModal,
                AddressBookModal: AddressBookModal,
                DevToolsModal: DevToolsScreen,
                DevToolsXpubModal: DevToolsXpubScreen,
                DevToolsLogsModal: DevToolsLogsScreen,
                DevToolsConfigModal: DevToolsConfigScreen
            }
        }
    },
    screenOptions: {
        headerShown: false
    }
});
