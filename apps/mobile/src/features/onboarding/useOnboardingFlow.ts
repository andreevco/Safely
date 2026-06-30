import { useNavigation } from '@react-navigation/core';
import { CommonActions } from '@react-navigation/native';
import { useCallback } from 'react';
import { Keyboard } from 'react-native';

import type { PortfolioNetworkType } from '@safely/core';
import type { AccountPortfolioSource } from '@safely/ux';
import { useAppContext, useCreateAccount, useLoader } from '@safely/ux';

// TODO IMPORT Discuss with Max what to do with this
// eslint-disable-next-line boundaries/element-types
import { tabsInitialState } from '@mobile/app/navigation/tabs';
import { usePasscode } from '@mobile/entities/security';

const routes = {
    passcode: 'OnboardingPasscodeScreen',
    biometry: 'BiometryScreen',
    accountCreated: 'AccountCreatedScreen'
} as const;

type OnboardingIntent =
    | { type: 'create' }
    | { type: 'signIn' }
    | { type: 'import'; mnemonic: string[]; networkType: PortfolioNetworkType }
    | { type: 'watchOnly'; input: string; networkType: PortfolioNetworkType };

// TODO: Don't like this
let _intent: OnboardingIntent = { type: 'create' };

function intentToPortfolioSource(intent: OnboardingIntent): AccountPortfolioSource | null {
    switch (intent.type) {
        case 'create':
            return { kind: 'generated' };
        case 'import':
            return { kind: 'imported', mnemonic: intent.mnemonic, networkType: intent.networkType };
        case 'watchOnly':
            return { kind: 'watchOnly', input: intent.input, networkType: intent.networkType };
        case 'signIn':
            return null;
    }
}

export function useOnboardingFlow() {
    const navigation = useNavigation();
    const { mutateAsync: createAccount } = useCreateAccount({
        setActive: true
    });
    const { withLoader } = useLoader();
    const { set: setPasscode } = usePasscode();
    const {
        storage: {
            sync: { getSecureEncrypted }
        }
    } = useAppContext();

    const onSuccessCreate = useCallback(() => {
        _intent = { type: 'create' };
        navigation.dispatch(CommonActions.navigate(routes.passcode));
    }, [navigation]);

    const onSuccessSignIn = useCallback(() => {
        _intent = { type: 'signIn' };
        navigation.dispatch(CommonActions.navigate(routes.passcode));
    }, [navigation]);

    const onMnemonicReady = useCallback(
        (mnemonic: string[], networkType: PortfolioNetworkType) => {
            _intent = { type: 'import', mnemonic, networkType };
            navigation.dispatch(CommonActions.navigate(routes.passcode));
        },
        [navigation]
    );

    const onWatchOnlyReady = useCallback(
        (input: string, networkType: PortfolioNetworkType) => {
            _intent = { type: 'watchOnly', input, networkType };
            navigation.dispatch(CommonActions.navigate(routes.passcode));
        },
        [navigation]
    );

    const onPasscodeReady = useCallback(
        async (passcode: string) => {
            await setPasscode(passcode);

            const firstPortfolio = intentToPortfolioSource(_intent);

            if (firstPortfolio) {
                Keyboard.dismiss();
                await withLoader(async () => {
                    using secureEncryptedStorage = getSecureEncrypted();

                    // don't ask for the password while setting app initially after first account creation during onboarding to provide smooth user experience
                    secureEncryptedStorage.UNSAFE_SKIP_SECURITY_CHECK_unlock();

                    await createAccount({ secureEncryptedStorage, firstPortfolio });
                });
                _intent = { type: 'create' };
            }

            navigation.dispatch(CommonActions.navigate(routes.biometry));
        },
        [navigation, setPasscode, createAccount, withLoader, getSecureEncrypted]
    );

    const onBiometryFinished = useCallback(() => {
        if (_intent.type === 'signIn') {
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
        onSuccessCreate,
        onSuccessSignIn,
        onMnemonicReady,
        onWatchOnlyReady,
        onPasscodeReady,
        onBiometryFinished,
        onAccountCreatedFinished
    };
}
