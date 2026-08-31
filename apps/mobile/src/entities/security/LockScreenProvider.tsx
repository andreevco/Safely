import type { FC, PropsWithChildren } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { useAppState } from '@safely/ux';

import { useLockScreenQuery } from './useLockScreen';
import { usePasscode } from './usePasscode';

interface LockScreenContextValue {
    isLocked: boolean;
    unlock: () => void;
}

const LockScreenContext = createContext<LockScreenContextValue | undefined>(undefined);

export function useLockScreenControl() {
    const context = useContext(LockScreenContext);

    if (!context) {
        throw new Error('useLockScreenControl must be used within LockScreenProvider');
    }

    return context;
}

export const LockScreenProvider: FC<PropsWithChildren> = ({ children }) => {
    const { current, previous } = useAppState();
    const { isSet: hasPasscode } = usePasscode();
    const { data: isLockScreenEnabled } = useLockScreenQuery();

    const isEnabled = isLockScreenEnabled && hasPasscode;
    const [isLockRequested, setIsLockRequested] = useState(isEnabled);

    useEffect(() => {
        // "inactive" state indicates that the app is still in the foreground,
        // but is either transitioning to the background
        // or showing Face ID, notifications, calls, etc.
        // We should consider locking the app only when it has transitioned to the background.
        // - https://reactnative.dev/docs/appstate
        if (isEnabled && previous !== 'background' && current === 'background') {
            setIsLockRequested(true);
        }
    }, [isEnabled, current, previous]);

    const unlock = useCallback(() => {
        setIsLockRequested(false);
    }, []);

    const value = useMemo(
        () => ({ isLocked: isLockRequested && isEnabled, unlock }),
        [isEnabled, isLockRequested, unlock]
    );

    return <LockScreenContext value={value}>{children}</LockScreenContext>;
};
