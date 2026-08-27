import type { FC, ReactNode } from 'react';
import { useState } from 'react';

import { SecurityCheckCancelledError, useEnteredBackground, useEraseAllData } from '@safely/ux';
import { EraseDataModal, LockScreen, PasscodeVerification } from '@safely/web-ui';

import { useLockScreen } from './useLockScreen';
import { usePasscode, usePasscodePromptStore, usePasscodeVerification } from '../passcode';

export type AppLockProps = {
    children: ReactNode;
};

export const AppLock: FC<AppLockProps> = ({ children }) => {
    const passcode = usePasscode();
    const lockScreen = useLockScreen();

    const isEnabled = passcode.isSet && lockScreen.isEnabled;
    const [isLocked, setIsLocked] = useState(isEnabled);

    useEnteredBackground(() => {
        if (isEnabled) {
            setIsLocked(true);
        }
    });

    if (!passcode.isSet) {
        return children;
    }

    if (isLocked) {
        return <AppLockScreen onUnlocked={() => setIsLocked(false)} />;
    }

    return (
        <>
            {children}
            <PasscodePromptOverlay />
        </>
    );
};

type AppLockScreenProps = {
    onUnlocked: () => void;
};

/* signing out properly needs the keys this screen is guarding, so the only way out is erasing */
const AppLockScreen: FC<AppLockScreenProps> = props => {
    const { mutateAsync: eraseAllData } = useEraseAllData();
    const [isErasing, setIsErasing] = useState(false);

    const verification = usePasscodeVerification({
        onVerified: props.onUnlocked,
        hasBiometryAutoPrompt: true
    });

    return (
        <>
            <LockScreen
                value={verification.value}
                length={verification.length}
                isInvalid={verification.isInvalid}
                isLocked={verification.isLocked}
                remainingSeconds={verification.remainingSeconds}
                onCheckBiometry={verification.promptBiometry}
                onChange={verification.onChange}
                onSignOut={() => setIsErasing(true)}
            />

            {isErasing && (
                <EraseDataModal
                    onConfirm={() => void eraseAllData()}
                    onClose={() => setIsErasing(false)}
                />
            )}
        </>
    );
};

const PasscodePromptOverlay: FC = () => {
    const request = usePasscodePromptStore(state => state.request);
    const close = usePasscodePromptStore(state => state.close);

    if (request === null) {
        return null;
    }

    return (
        <PasscodePromptScreen
            title={request.title}
            subtitle={request.subtitle}
            onVerified={() => {
                request.resolve();
                close();
            }}
            onCancel={() => {
                request.reject(new SecurityCheckCancelledError());
                close();
            }}
        />
    );
};

type PasscodePromptScreenProps = {
    title?: string;
    subtitle?: string;
    onVerified: () => void;
    onCancel: () => void;
};

const PasscodePromptScreen: FC<PasscodePromptScreenProps> = props => {
    const verification = usePasscodeVerification({ onVerified: props.onVerified });

    return (
        <PasscodeVerification
            title={props.title}
            subtitle={props.subtitle}
            value={verification.value}
            length={verification.length}
            isInvalid={verification.isInvalid}
            isLocked={verification.isLocked}
            remainingSeconds={verification.remainingSeconds}
            onCheckBiometry={verification.promptBiometry}
            onChange={verification.onChange}
            onCancel={props.onCancel}
        />
    );
};
