import { StaticScreenProps } from '@react-navigation/native';
import { useEffect, useRef } from 'react';

import { usePasscodeLockout } from '@mobile/entities/security';
import { useSignOutConfirmation } from '@mobile/features/settings/useSignOutConfirmation';

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
    const handleSignOut = useSignOutConfirmation();
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
        return <LockoutContent remainingSeconds={remainingSeconds} onSignOut={handleSignOut} />;
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
