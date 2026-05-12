import { CommonActions } from '@react-navigation/native';
import {
    createContext,
    FC,
    PropsWithChildren,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState
} from 'react';

import { useAppState } from '@safely/ux';

import { navigationRef } from '@mobile/app/navigation/navigationRef';

import { useLockScreenQuery } from './useLockScreen';
import { usePasscode } from './usePasscode';

interface LockScreenContextValue {
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
    const [isLocked, setIsLocked] = useState(isEnabled);
    const isInitialRender = useRef(true);

    useEffect(() => {
        // "inactive" state indicates that the app is still in the foreground,
        // but is either transitioning to the background
        // or showing Face ID, notifications, calls, etc.
        // We should consider locking the app only when it has transitioned to the background.
        // - https://reactnative.dev/docs/appstate
        if (isEnabled && previous !== 'background' && current === 'background') {
            setIsLocked(true);
        }
    }, [isEnabled, current, previous]);

    useEffect(() => {
        if (isInitialRender.current) {
            isInitialRender.current = false;

            return;
        }

        if (
            isLocked &&
            isEnabled &&
            navigationRef.isReady() &&
            navigationRef.getCurrentRoute()?.name !== 'LockScreen'
        ) {
            navigationRef.dispatch(CommonActions.navigate('LockScreen'));
        }
    }, [isLocked, isEnabled]);

    const unlock = useCallback(() => {
        setIsLocked(false);

        if (navigationRef.canGoBack()) {
            navigationRef.goBack();
        } else {
            navigationRef.dispatch(
                CommonActions.reset({
                    index: 0,
                    routes: [{ name: 'TabsNavigator' }]
                })
            );
        }
    }, []);

    return <LockScreenContext value={{ unlock }}>{children}</LockScreenContext>;
};
