import { StaticScreenProps } from '@react-navigation/native';
import { useEffect, useRef } from 'react';

import { usePasscodeLockout } from '@mobile/entities/security';
import { useLogOutAllConfirmation } from '@mobile/features/settings/useLogOutAllConfirmation';

import { LockoutContent } from './components/LockoutContent';
import { PasscodeContent } from './components/PasscodeContent';

type PasscodeVerificationScreenProps = StaticScreenProps<{
    onSuccess: () => void;
    onClose?: () => void;
    title?: string;
}>;

export const PasscodeVerificationScreen = (props: PasscodeVerificationScreenProps) => {
    const { onSuccess, onClose, title } = props.route.params;

    const { isLocked, remainingSeconds, recordFailedAttempt, resetAttempts } = usePasscodeLockout();
    const handleLogOut = useLogOutAllConfirmation();
    const successCalled = useRef(false);

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
        <PasscodeContent
            onSuccess={onSuccess}
            successCalled={successCalled}
            title={title}
            recordFailedAttempt={recordFailedAttempt}
            resetAttempts={resetAttempts}
        />
    );
};
