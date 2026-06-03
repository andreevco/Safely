import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AnalyticsProvider, createPersister, createQueryClient, QueryProvider } from '@safely/ux';

import { BlurOverlay } from '@mobile/entities/security';
import { logger } from '@mobile/shared/logger';
import { LoaderProvider, LoaderServiceProvider } from '@mobile/shared/providers/loader';
import { ToastProvider, ToastServiceProvider } from '@mobile/shared/providers/toast';

import { AppContextProvider, SecurityCheckInitializer } from './AppContext';
import { AppNavigation } from './AppNavigation';
import { RootSuspenseGate } from './root-suspense';
import { REGULAR_MOBILE_STORAGE_ONLY_APP_LEVEL_USE } from './storage';

const persister = createPersister(
    REGULAR_MOBILE_STORAGE_ONLY_APP_LEVEL_USE.storage.child('persister'),
    logger
);
const queryClient = createQueryClient(logger);

export const App = () => {
    return (
        <GestureHandlerRootView>
            <SafeAreaProvider>
                <KeyboardProvider>
                    <QueryProvider persister={persister} queryClient={queryClient}>
                        <ToastServiceProvider>
                            <LoaderServiceProvider>
                                <AppContextProvider>
                                    <RootSuspenseGate>
                                        <AnalyticsProvider>
                                            <SecurityCheckInitializer />
                                            <LoaderProvider>
                                                <AppNavigation />
                                                <ToastProvider />
                                            </LoaderProvider>
                                        </AnalyticsProvider>
                                    </RootSuspenseGate>
                                    <BlurOverlay />
                                </AppContextProvider>
                            </LoaderServiceProvider>
                        </ToastServiceProvider>
                    </QueryProvider>
                </KeyboardProvider>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
};
