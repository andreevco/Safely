import { CommonActions, useNavigation } from '@react-navigation/native';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { usePasscodeVerification } from '@mobile/entities/security';
import { useLogOutAllConfirmation } from '@mobile/features/settings/useLogOutAllConfirmation';
import { LockoutContent, PasscodeInput, PasscodeLayout, Screen, Text } from '@mobile/shared/ui';

import { styles } from './LockScreen.styles';

const SHOW_SIGN_OUT_THRESHOLD = 3;

export const LockScreen = () => {
    const { t } = useTranslation();
    const navigation = useNavigation();
    const handleLogOut = useLogOutAllConfirmation();

    const handleSuccess = useCallback(() => {
        navigation.dispatch(
            CommonActions.reset({
                index: 0,
                routes: [{ name: 'TabsNavigator' }]
            })
        );
    }, [navigation]);

    const {
        inputValue,
        digitsAmount,
        isSuccess,
        isError,
        isLocked,
        remainingSeconds,
        failedAttempts,
        handleInputChange
    } = usePasscodeVerification({ onSuccess: handleSuccess });

    const isSignOutVisible = failedAttempts >= SHOW_SIGN_OUT_THRESHOLD;

    if (isLocked) {
        return <LockoutContent remainingSeconds={remainingSeconds} onSignOut={handleLogOut} />;
    }

    return (
        <Screen>
            <Screen.Header variant="left">
                <Screen.Header.Title />
                <View
                    style={styles.signOutButton(isSignOutVisible)}
                    pointerEvents={isSignOutVisible ? 'auto' : 'none'}
                >
                    <Screen.Header.Button type="small" onPress={handleLogOut}>
                        <Text variant="labelM" color="primary">
                            {t('passcode.lockout.signOut')}
                        </Text>
                    </Screen.Header.Button>
                </View>
            </Screen.Header>

            <PasscodeLayout title={t('lockScreen.title')}>
                <PasscodeInput
                    numberOfDigits={digitsAmount}
                    value={inputValue}
                    onChange={handleInputChange}
                    isSuccess={isSuccess}
                    isError={isError}
                />
            </PasscodeLayout>
        </Screen>
    );
};
