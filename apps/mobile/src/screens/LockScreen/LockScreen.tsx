import { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { useAppState } from '@safely/ux';

import { usePasscodeVerification, useLockScreenControl } from '@mobile/entities/security';
import { authenticateBiometry, useBiometryQuery } from '@mobile/features/biometry';
import { useLogOutAllConfirmation } from '@mobile/features/settings/useLogOutAllConfirmation';
import { LockoutContent, PasscodeInput, PasscodeLayout, Screen, Text } from '@mobile/shared/ui';

export const LockScreen = () => {
    const { current } = useAppState();
    const { t } = useTranslation();
    const { unlock } = useLockScreenControl();
    const handleLogOut = useLogOutAllConfirmation();
    const { data: biometry } = useBiometryQuery();
    const hasPromptedRef = useRef(false);
    const hasUnlockedRef = useRef(false);

    const handleUnlock = useCallback(() => {
        if (hasUnlockedRef.current) {
            return;
        }

        hasUnlockedRef.current = true;
        unlock();
    }, [unlock]);

    const {
        inputValue,
        digitsAmount,
        isSuccess,
        isError,
        isLocked,
        remainingSeconds,
        handleInputChange
    } = usePasscodeVerification({ onSuccess: handleUnlock });

    useEffect(() => {
        if (hasPromptedRef.current || isLocked || !biometry?.isEnabled || current !== 'active') {
            return;
        }

        hasPromptedRef.current = true;

        void (async () => {
            const result = await authenticateBiometry();
            if (result.success) {
                handleUnlock();
            }
        })();
    }, [isLocked, biometry?.isEnabled, handleUnlock, current]);

    if (isLocked) {
        return <LockoutContent remainingSeconds={remainingSeconds} onSignOut={handleLogOut} />;
    }

    return (
        <Screen>
            <Screen.Header variant="left">
                <Screen.Header.Title />
                <Screen.Header.Button type="small" onPress={handleLogOut}>
                    <Text variant="labelM" color="primary">
                        {t('passcode.lockout.signOut')}
                    </Text>
                </Screen.Header.Button>
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
