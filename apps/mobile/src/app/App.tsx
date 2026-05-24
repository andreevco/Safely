import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { createPersister, createQueryClient, QueryProvider } from '@safely/ux';

import { BlurOverlay } from '@mobile/entities/security';
import { loggerRegistry } from '@mobile/shared/logger';
import { LoaderProvider, LoaderServiceProvider } from '@mobile/shared/providers/loader';
import { ToastProvider, ToastServiceProvider } from '@mobile/shared/providers/toast';

import { AppContextProvider, LoggerLifecycle, SecurityCheckInitializer } from './AppContext';
import { AppNavigation } from './AppNavigation';
import { RootSuspenseGate } from './root-suspense';
import { REGULAR_MOBILE_STORAGE_ONLY_APP_LEVEL_USE } from './storage';

const persister = createPersister(
    REGULAR_MOBILE_STORAGE_ONLY_APP_LEVEL_USE.storage.child('persister'),
    loggerRegistry
);
const queryClient = createQueryClient(loggerRegistry);

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
                                        <SecurityCheckInitializer />
                                        <LoggerLifecycle />
                                        <LoaderProvider>
                                            <AppNavigation />
                                            <ToastProvider />
                                        </LoaderProvider>
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
