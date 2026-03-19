import { CommonActions, useNavigation } from '@react-navigation/native';
import { useCallback } from 'react';
import { Keyboard } from 'react-native';

import { useCreateAccount } from '@safely/ux';

import { usePasscode } from '@mobile/entities/security';
import { useLoader } from '@safely/ux';

const routes = {
    passcode: 'OnboardingPasscodeScreen',
    biometry: 'BiometryScreen',
    notifications: 'OnboardingNotificationsScreen',
    accountCreated: 'AccountCreatedScreen'
} as const;

let _isSignInFlow = false;

export function useOnboardingFlow() {
    const navigation = useNavigation();
    const { mutateAsync: createAccount } = useCreateAccount({
        createWallet: true,
        setActive: true
    });
    const { set: setPasscode } = usePasscode();
    const { withLoader } = useLoader();

    const onStartCreate = useCallback(() => {
        _isSignInFlow = false;
        navigation.dispatch(CommonActions.navigate(routes.passcode));
    }, [navigation]);

    const onStartSignIn = useCallback(() => {
        _isSignInFlow = true;
        navigation.dispatch(CommonActions.navigate(routes.passcode));
    }, [navigation]);

    const onPasscodeReady = useCallback(
        async (passcode: string) => {
            await setPasscode(passcode);

            if (!_isSignInFlow) {
                Keyboard.dismiss();
                await withLoader(createAccount);
            }

            navigation.dispatch(CommonActions.navigate(routes.biometry));
        },
        [navigation, setPasscode, createAccount, withLoader]
    );

    const onBiometryFinished = useCallback(() => {
        navigation.dispatch(CommonActions.navigate(routes.notifications));
    }, [navigation]);

    const onNotificationsFinished = useCallback(() => {
        if (_isSignInFlow) {
            navigation.dispatch(
                CommonActions.reset({
                    index: 0,
                    routes: [{ name: 'TabsNavigator' }]
                })
            );
        } else {
            navigation.dispatch(CommonActions.navigate(routes.accountCreated));
        }
    }, [navigation]);

    const onAccountCreatedFinished = useCallback(() => {
        navigation.dispatch(
            CommonActions.reset({
                index: 0,
                routes: [{ name: 'TabsNavigator' }]
            })
        );
    }, [navigation]);

    return {
        onStartCreate,
        onStartSignIn,
        onPasscodeReady,
        onBiometryFinished,
        onNotificationsFinished,
        onAccountCreatedFinished
    };
}
