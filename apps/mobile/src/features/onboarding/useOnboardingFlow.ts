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
        navigation.navigate('OnboardingPasscodeScreen', { source: { kind: 'generated' } });
    }, [navigation]);

    const onSuccessSignIn = useCallback(() => {
        navigation.navigate('OnboardingPasscodeScreen', { source: null });
    }, [navigation]);

    const onMnemonicReady = useCallback(
        (mnemonic: string[], networkType: PortfolioNetworkType) => {
            navigation.navigate('OnboardingPasscodeScreen', {
                source: { kind: 'imported', mnemonic, networkType }
            });
        },
        [navigation]
    );

    const onWatchOnlyReady = useCallback(
        (input: string, networkType: PortfolioNetworkType) => {
            navigation.navigate('OnboardingPasscodeScreen', {
                source: { kind: 'watchOnly', input, networkType }
            });
        },
        [navigation]
    );

    const onPasscodeReady = useCallback(
        async (passcode: string, source: AccountPortfolioSource | null) => {
            await setPasscode(passcode);

            if (source) {
                Keyboard.dismiss();
                await withLoader(async () => {
                    using secureEncryptedStorage = getSecureEncrypted();

                    // don't ask for the password while setting app initially after first account creation during onboarding to provide smooth user experience
                    secureEncryptedStorage.UNSAFE_SKIP_SECURITY_CHECK_unlock();

                    await createAccount({ secureEncryptedStorage, firstPortfolio: source });
                });
            }

            navigation.navigate('BiometryScreen', { isSignIn: source === null });
        },
        [navigation, setPasscode, createAccount, withLoader, getSecureEncrypted]
    );

    const onBiometryFinished = useCallback(
        (isSignIn: boolean) => {
            if (isSignIn) {
                navigation.dispatch(
                    CommonActions.reset({
                        index: 0,
                        routes: [{ name: 'TabsNavigator', state: tabsInitialState }]
                    })
                );
            } else {
                navigation.navigate('AccountCreatedScreen');
            }
        },
        [navigation]
    );

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
