import { CommonActions, useNavigation } from '@react-navigation/native';
import { useCallback } from 'react';

import { useGeneratePortfolio } from '@safely/ux';

import { useSetPasscode } from '@mobile/entities/security';
import { useLoader } from '@mobile/shared/providers/loader';

const routes = {
    passcode: 'OnboardingPasscodeScreen',
    biometry: 'BiometryScreen',
    notifications: 'OnboardingNotificationsScreen',
    accountCreated: 'AccountCreatedScreen'
} as const;

export function useOnboardingFlow() {
    const navigation = useNavigation();
    const { mutateAsync: generatePortfolio } = useGeneratePortfolio();
    const { mutateAsync: setPasscode } = useSetPasscode();
    const { withLoader } = useLoader();

    const onStartCreate = useCallback(() => {
        navigation.dispatch(CommonActions.navigate(routes.passcode));
    }, [navigation]);

    const onPasscodeReady = useCallback(
        async (passcode: string) => {
            await setPasscode(passcode);
            navigation.dispatch(CommonActions.navigate(routes.biometry));
        },
        [navigation, setPasscode]
    );

    const onBiometryFinished = useCallback(() => {
        navigation.dispatch(CommonActions.navigate(routes.notifications));
    }, [navigation]);

    const onNotificationsFinished = useCallback(() => {
        navigation.dispatch(CommonActions.navigate(routes.accountCreated));
    }, [navigation]);

    const onAccountCreatedFinished = useCallback(async () => {
        await withLoader(async () => {
            await generatePortfolio();
        });

        navigation.dispatch(
            CommonActions.reset({
                index: 0,
                routes: [{ name: 'TabsNavigator' }]
            })
        );
    }, [navigation, generatePortfolio, withLoader]);

    return {
        onStartCreate,
        onPasscodeReady,
        onBiometryFinished,
        onNotificationsFinished,
        onAccountCreatedFinished
    };
}
