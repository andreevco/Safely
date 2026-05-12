import { RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { usePasscodeVerification, useLockScreenControl } from '@mobile/entities/security';
import { useLogOutAllConfirmation } from '@mobile/features/settings/useLogOutAllConfirmation';
import { LockoutContent, PasscodeInput, PasscodeLayout, Screen, Text } from '@mobile/shared/ui';

import { styles } from './LockScreen.styles';

const SHOW_SIGN_OUT_THRESHOLD = 3;

interface LockScreenProps {
    route: RouteProp<{
        params?: {
            withLogoutButton?: boolean;
        };
    }>;
}

export const LockScreen = (props: LockScreenProps) => {
    const { withLogoutButton } = props.route.params ?? {};
    const { t } = useTranslation();
    const { unlock } = useLockScreenControl();
    const handleLogOut = useLogOutAllConfirmation();

    const {
        inputValue,
        digitsAmount,
        isSuccess,
        isError,
        isLocked,
        remainingSeconds,
        failedAttempts,
        handleInputChange
    } = usePasscodeVerification({ onSuccess: unlock });

    const isSignOutVisible = withLogoutButton || failedAttempts >= SHOW_SIGN_OUT_THRESHOLD;

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
