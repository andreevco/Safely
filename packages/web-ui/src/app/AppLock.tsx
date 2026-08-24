import type { FC, ReactNode } from 'react';
import { useState } from 'react';

import { useEraseAllData } from '@safely/ux';

import type { PasscodeStorage } from '../entities';
import { usePasscode } from '../entities';
import { EraseDataModal } from '../features';
import { LockScreen, PasscodeVerification } from '../pages';
import { PasscodePromptCancelledError, usePasscodePromptStore } from '../shared';

export type AppLockProps = {
    passcodeStorage: PasscodeStorage;
    children: ReactNode;
};

export const AppLock: FC<AppLockProps> = props => {
    const { passcodeStorage, children } = props;

    const passcode = usePasscode(passcodeStorage);
    const [isErasing, setIsErasing] = useState(false);
    const [isUnlocked, setIsUnlocked] = useState(!passcode.isSet);
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

    if (request !== null) {
        return (
            <PasscodeVerification
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
        );
    }

    return children;
};
