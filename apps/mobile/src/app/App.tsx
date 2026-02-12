import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { createPersister, QueryProvider } from '@safely/ux';

import { LoaderProvider } from '@mobile/shared/providers/loader';
import { ToastProvider, ToastServiceProvider } from '@mobile/shared/providers/toast';
import { createMMKVTreeStorage } from '@mobile/shared/storage/mmkv';

import { AppContextProvider } from './AppContext';
import { AppNavigation } from './AppNavigation';

const persister = createPersister(createMMKVTreeStorage('persister').storage);

export const App = () => {
    return (
        <GestureHandlerRootView>
            <SafeAreaProvider>
                <KeyboardProvider>
                    <QueryProvider persister={persister}>
                        <ToastServiceProvider>
                            <AppContextProvider>
                                <LoaderProvider>
                                    <AppNavigation />
                                    <ToastProvider />
                                </LoaderProvider>
                            </AppContextProvider>
                        </ToastServiceProvider>
                    </QueryProvider>
                </KeyboardProvider>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
};
