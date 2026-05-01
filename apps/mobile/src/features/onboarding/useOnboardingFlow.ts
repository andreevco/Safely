import { CommonActions, useNavigation } from '@react-navigation/native';
import { useCallback } from 'react';
import { Keyboard } from 'react-native';

import { useAppContext, useCreateAccount, useLoader } from '@safely/ux';

import { tabsInitialState } from '@mobile/app/navigation/tabs';
import { usePasscode } from '@mobile/entities/security';

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
    const { withLoader } = useLoader();
    const { set: setPasscode } = usePasscode();
    const {
        storage: {
            sync: { getSecureEncrypted }
        }
    } = useAppContext();

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
                await withLoader(async () => {
                    using secureEncryptedStorage = getSecureEncrypted();
                    secureEncryptedStorage.UNSAFE_SKIP_SECURITY_CHECK_unlock();

                    await createAccount({ secureEncryptedStorage });
                });
            }

            navigation.dispatch(CommonActions.navigate(routes.biometry));
        },
        [navigation, setPasscode, createAccount, withLoader, getSecureEncrypted]
    );

    const onBiometryFinished = useCallback(() => {
        navigation.dispatch(CommonActions.navigate(routes.notifications));
    }, [navigation]);

    const onNotificationsFinished = useCallback(() => {
        if (_isSignInFlow) {
            navigation.dispatch(
                CommonActions.reset({
                    index: 0,
                    routes: [{ name: 'TabsNavigator', state: tabsInitialState }]
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
                routes: [{ name: 'TabsNavigator', state: tabsInitialState }]
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
