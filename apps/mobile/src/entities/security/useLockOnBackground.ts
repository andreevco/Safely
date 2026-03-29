import { CommonActions } from '@react-navigation/native';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { navigationRef } from '@mobile/app/navigation/navigationRef';

import { useLockScreenQuery } from './useLockScreen';
import { usePasscode } from './usePasscode';

export function useLockOnBackground() {
    const { data: isLockScreenEnabled } = useLockScreenQuery();
    const { isSet: hasPasscode } = usePasscode();
    const appStateRef = useRef(AppState.currentState);

    useEffect(() => {
        if (!isLockScreenEnabled || !hasPasscode) {
            return;
        }

        const subscription = AppState.addEventListener('change', nextAppState => {
            const wasActive = appStateRef.current === 'active';
            appStateRef.current = nextAppState;

            if (wasActive && (nextAppState === 'inactive' || nextAppState === 'background')) {
                navigationRef.dispatch(
                    CommonActions.reset({
                        index: 0,
                        routes: [{ name: 'LockScreen' }]
                    })
                );
            }
        });

        return () => subscription.remove();
    }, [isLockScreenEnabled, hasPasscode]);
}
