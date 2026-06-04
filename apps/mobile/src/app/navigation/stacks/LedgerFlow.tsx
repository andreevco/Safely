import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { LedgerSessionProvider } from '@mobile/features/ledger';
import { LedgerDiscoveryScreen } from '@mobile/screens/LedgerDiscoveryScreen';
import { LedgerImportAccountsScreen } from '@mobile/screens/LedgerImportAccountsScreen';
import { LedgerPairingScreen } from '@mobile/screens/LedgerPairingScreen';
import { LedgerPairingSuccessScreen } from '@mobile/screens/LedgerPairingSuccessScreen';
import { logger } from '@mobile/shared/logger';

const Stack = createNativeStackNavigator();

export const LedgerFlow = () => {
    return (
        <LedgerSessionProvider logger={logger}>
            <Stack.Navigator
                initialRouteName="LedgerDiscoveryModal"
                screenOptions={{ headerShown: false }}
            >
                <Stack.Screen name="LedgerDiscoveryModal" component={LedgerDiscoveryScreen} />
                <Stack.Screen name="LedgerPairingModal" component={LedgerPairingScreen} />
                <Stack.Screen
                    name="LedgerPairingSuccessModal"
                    component={LedgerPairingSuccessScreen}
                />
                <Stack.Screen
                    name="LedgerImportAccountsModal"
                    component={LedgerImportAccountsScreen}
                />
            </Stack.Navigator>
        </LedgerSessionProvider>
    );
};
