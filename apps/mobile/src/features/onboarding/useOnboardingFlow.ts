import { PASSCODE_KEY } from '@mobile/entities/security';
import { useLoader } from '@mobile/shared/providers/loader';
import { CommonActions, useNavigation } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import { useCallback } from 'react';

import { generateBip39Accessor } from '@safely/core/entities/seed';

import { useCreatePortfolio } from './useCreatePortfolio';

const routes = {
    passcode: 'OnboardingPasscodeScreen',
    biometry: 'BiometryScreen',
    notifications: 'OnboardingNotificationsScreen',
    accountCreated: 'AccountCreatedScreen'
} as const;

export function useOnboardingFlow() {
    const navigation = useNavigation();
    const createPortfolio = useCreatePortfolio();
    const { withLoader } = useLoader();

    const onStartCreate = useCallback(() => {
        navigation.dispatch(CommonActions.navigate(routes.passcode));
    }, [navigation]);

    const onPasscodeReady = useCallback(
        async (passcode: string) => {
            await SecureStore.setItemAsync(PASSCODE_KEY, passcode);
            navigation.dispatch(CommonActions.navigate(routes.biometry));
        },
        [navigation]
    );

    const onBiometryFinished = useCallback(() => {
        navigation.dispatch(CommonActions.navigate(routes.notifications));
    }, [navigation]);

    const onNotificationsFinished = useCallback(() => {
        navigation.dispatch(CommonActions.navigate(routes.accountCreated));
    }, [navigation]);

    const onAccountCreatedFinished = useCallback(async () => {
        await withLoader(async () => {
            using accessor = generateBip39Accessor();
            const mnemonic = [...accessor.value];

            const defaultMeta = {
                name: 'Wallet 1',
                icon: { type: 'emoji' as const, value: '🙂' }
            };

            await createPortfolio(mnemonic, defaultMeta);
        });

        navigation.dispatch(
            CommonActions.reset({
                index: 0,
                routes: [{ name: 'TabsNavigator' }]
            })
        );
    }, [navigation, createPortfolio, withLoader]);

    return {
        onStartCreate,
        onPasscodeReady,
        onBiometryFinished,
        onNotificationsFinished,
        onAccountCreatedFinished
    };
}
