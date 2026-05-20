import { useNavigation, StaticScreenProps } from '@react-navigation/native';
import { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { RootStackNavigationProp } from '@mobile/app/navigation/types';
import { usePasscodeVerification } from '@mobile/entities/security';
import { useLogOutAllConfirmation } from '@mobile/features/settings/useLogOutAllConfirmation';
import { LockoutContent, PasscodeInput, PasscodeLayout, Screen } from '@mobile/shared/ui';

type PasscodeVerificationScreenProps = StaticScreenProps<{
    onSuccess: () => void;
    onClose?: () => void;
    title?: string;
}>;

export const PasscodeVerificationScreen = (props: PasscodeVerificationScreenProps) => {
    const { onSuccess, onClose, title } = props.route.params;

    const { t } = useTranslation();
    const navigation = useNavigation<RootStackNavigationProp>();
    const handleLogOut = useLogOutAllConfirmation();
    const successCalled = useRef(false);

    const handleSuccess = useCallback(() => {
        successCalled.current = true;
        navigation.goBack();
        setTimeout(onSuccess, 100);
    }, [navigation, onSuccess]);

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

            <PasscodeLayout title={title ?? t('passcode.verify.title')}>
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
