import { StaticScreenProps, useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useRef } from 'react';

import { useSignOutFromAccount } from '@safely/ux';

import { RootStackNavigationProp } from '@mobile/app/navigation/types';
import { usePasscodeLockout } from '@mobile/entities/security';

import { LockoutContent } from './components/LockoutContent';
import { PasscodeContent } from './components/PasscodeContent';

type PasscodeVerificationScreenProps = StaticScreenProps<{
    onSuccess: () => void;
    onClose?: () => void;
    title?: string;
}>;

export const PasscodeVerificationScreen = (props: PasscodeVerificationScreenProps) => {
    const { onSuccess, onClose, title } = props.route.params;

    const navigation = useNavigation<RootStackNavigationProp>();
    const { isLocked, remainingSeconds, recordFailedAttempt, resetAttempts } = usePasscodeLockout();
    const { mutateAsync: signOutAccount } = useSignOutFromAccount();
    const successCalled = useRef(false);

    useEffect(() => {
        const ref = successCalled;

        return () => {
            if (!ref.current) {
                onClose?.();
            }
        };
    }, [onClose]);

    const handleSignOut = useCallback(async () => {
        await signOutAccount();
        navigation.reset({
            index: 0,
            routes: [{ name: 'WelcomeScreen' }]
        });
    }, [signOutAccount, navigation]);

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
