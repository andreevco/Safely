import { useNavigation } from '@react-navigation/core';
import type { StaticScreenProps } from '@react-navigation/native';
import { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { usePasscodeVerification } from '@mobile/entities/security';
import { authenticateBiometry, getBiometryIcon, useBiometryQuery } from '@mobile/features/biometry';
import { useLogOutAllConfirmation } from '@mobile/features/settings/useLogOutAllConfirmation';
import { TEST_ID } from '@mobile/shared/constants';
import { LockoutContent, PasscodeView, Screen } from '@mobile/shared/ui';

type PasscodeVerificationScreenProps = StaticScreenProps<{
    onSuccess: () => void;
    onClose?: () => void;
    title?: string;
    subtitle?: string;
}>;

export const PasscodeVerificationScreen = (props: PasscodeVerificationScreenProps) => {
    const { onSuccess, onClose, title, subtitle } = props.route.params;

    const { t } = useTranslation();
    const navigation = useNavigation();
    const handleLogOut = useLogOutAllConfirmation();
    const { data: biometry } = useBiometryQuery();
    const successCalled = useRef(false);

    const handleSuccess = useCallback(() => {
        successCalled.current = true;
        navigation.goBack();
        setTimeout(onSuccess, 100);
    }, [navigation, onSuccess]);

    const handleBiometryPress = useCallback(async () => {
        const result = await authenticateBiometry();

        if (result.success) {
            handleSuccess();
        }
    }, [handleSuccess]);

    const {
        inputValue,
        digitsAmount,
        isSuccess,
        isError,
        isLocked,
        remainingSeconds,
        handleInputChange
    } = usePasscodeVerification({ onSuccess: handleSuccess });

    useEffect(() => {
        const ref = successCalled;

        return () => {
            if (!ref.current) {
                onClose?.();
            }
        };
    }, [onClose]);

    if (isLocked) {
        return <LockoutContent remainingSeconds={remainingSeconds} onSignOut={handleLogOut} />;
    }

    return (
        <Screen>
            <Screen.Header variant="left">
                <Screen.Header.Title />
                <Screen.Header.CloseButton />
            </Screen.Header>

            <PasscodeView
                testID={TEST_ID.passcodeVerification.screen}
                title={title ?? t('passcode.verify.title')}
                description={subtitle}
                numberOfDigits={digitsAmount}
                value={inputValue}
                onChange={handleInputChange}
                isSuccess={isSuccess}
                isError={isError}
                biometry={
                    biometry?.isEnabled
                        ? {
                              onPress: handleBiometryPress,
                              icon: getBiometryIcon(biometry.availableType)
                          }
                        : undefined
                }
            />
        </Screen>
    );
};
