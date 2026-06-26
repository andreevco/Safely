import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AddressBookModal } from '@mobile/screens/AddressBookModal';
import { DevToolsConfigScreen } from '@mobile/screens/DevToolsConfigScreen';
import { DevToolsLogsScreen } from '@mobile/screens/DevToolsLogsScreen';
import { DevToolsScreen } from '@mobile/screens/DevToolsScreen';
import { DevToolsSyncStorageScreen } from '@mobile/screens/DevToolsSyncStorageScreen';
import { DevToolsXpubScreen } from '@mobile/screens/DevToolsXpubScreen';
import { LanguageScreen } from '@mobile/screens/LanguageScreen';
import { SecurityScreen } from '@mobile/screens/SecurityScreen';
import { SettingsScreen } from '@mobile/screens/SettingsScreen';

export const SettingsStack = createNativeStackNavigator({
    initialRouteName: 'SettingsRootModal',
    groups: {
        Screens: {
            screens: {
                SettingsRootModal: SettingsScreen,
                LanguageModal: LanguageScreen,
                SecurityModal: SecurityScreen,
                AddressBookModal: AddressBookModal,
                DevToolsModal: DevToolsScreen,
                DevToolsXpubModal: DevToolsXpubScreen,
                DevToolsLogsModal: DevToolsLogsScreen,
                DevToolsSyncStorageModal: DevToolsSyncStorageScreen,
                DevToolsConfigModal: DevToolsConfigScreen
            }
        }
    },
    screenOptions: {
        headerShown: false
    }
});
