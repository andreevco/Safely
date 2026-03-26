import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { createPersister, QueryProvider } from '@safely/ux';

import { LoaderProvider, LoaderServiceProvider } from '@mobile/shared/providers/loader';
import { ToastProvider, ToastServiceProvider } from '@mobile/shared/providers/toast';
import { mobileStorages } from '@mobile/shared/storage';

import { AppContextProvider } from './AppContext';
import { AppNavigation } from './AppNavigation';

const persister = createPersister(mobileStorages.persister.storage);

export const App = () => {
    return (
        <GestureHandlerRootView>
            <SafeAreaProvider>
                <KeyboardProvider>
                    <QueryProvider persister={persister}>
                        <ToastServiceProvider>
                            <LoaderServiceProvider>
                                <AppContextProvider>
                                    <LoaderProvider>
                                        <AppNavigation />
                                        <ToastProvider />
                                    </LoaderProvider>
                                </AppContextProvider>
                            </LoaderServiceProvider>
                        </ToastServiceProvider>
                    </QueryProvider>
                </KeyboardProvider>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
};
