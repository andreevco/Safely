import { AddWalletModal } from '@mobile/screens/AddWalletModal';
import { QRScanModal } from '@mobile/screens/QRScanModal';
import { ReceiveAssetModal } from '@mobile/screens/ReceiveAssetModal';
import { SelectAccountModal } from '@mobile/screens/SelectAccountModal';
import { createStaticNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { TabsNavigator } from './tabs';

export const RootStack = createNativeStackNavigator({
    initialRouteName: 'TabsNavigator',
    groups: {
        Screens: {
            screens: {
                TabsNavigator: TabsNavigator
            }
        },
        Modals: {
            screens: {
                QRScanModal: QRScanModal,
                AddWalletModal: AddWalletModal,
                SelectAccountModal: SelectAccountModal,
                ReceiveAssetModal: ReceiveAssetModal
            },
            screenOptions: {
                presentation: 'modal'
            }
        },
        Sheets: {
            screens: {},
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

const Navigation = createStaticNavigation(RootStack);

export default Navigation;
