import type { FC, ReactNode } from 'react';
import { useState } from 'react';

import { useEraseAllData } from '@safely/ux';
import {
    EraseDataModal,
    LockScreen,
    PasscodePromptCancelledError,
    PasscodeVerification,
    useLockScreen,
    usePasscode,
    usePasscodePromptStore
} from '@safely/web-ui';

export type AppLockProps = {
    children: ReactNode;
};

export const AppLock: FC<AppLockProps> = ({ children }) => {
    const passcode = usePasscode();
    const lockScreen = useLockScreen();
    const [isErasing, setIsErasing] = useState(false);
    const [isUnlocked, setIsUnlocked] = useState(!passcode.isSet || !lockScreen.isEnabled);
    const request = usePasscodePromptStore(state => state.request);
    const close = usePasscodePromptStore(state => state.close);
    const { mutateAsync: eraseAllData } = useEraseAllData();

    if (!passcode.isSet) {
        return children;
    }

    if (!isUnlocked) {
        return (
            <>
                <LockScreen
                    length={passcode.length}
                    verify={passcode.validate}
                    onUnlocked={() => setIsUnlocked(true)}
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
    }

    return (
        <>
            {children}

            {request !== null && (
                <PasscodeVerification
                    title={request.title}
                    length={passcode.length}
                    verify={passcode.validate}
                    onVerified={() => {
                        request.resolve();
                        close();
                    }}
                    onCancel={() => {
                        request.reject(new PasscodePromptCancelledError());
                        close();
                    }}
                />
            )}
        </>
    );
};
