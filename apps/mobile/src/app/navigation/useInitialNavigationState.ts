import type { NavigationContainerProps } from '@react-navigation/native';
import { useRef } from 'react';

import { useHasAccount } from '@safely/ux';

import { useIsAppRestricted } from '@mobile/entities/restrictions';
import { useLockScreenQuery, usePasscode } from '@mobile/entities/security';

export function useInitialNavigationState(): NavigationContainerProps['initialState'] {
    const hasAccount = useHasAccount();
    const isRestricted = useIsAppRestricted();
    const { isSet: hasPasscode } = usePasscode();
    const { data: isLockScreenEnabled } = useLockScreenQuery();

    const ref = useRef(
        (() => {
            if (isRestricted) {
                return isLockScreenEnabled
                    ? { routes: [{ name: 'LockScreen' as const }] }
                    : { routes: [{ name: 'RestrictedScreen' as const }] };
            }

            if (!hasPasscode || !hasAccount) {
                return { routes: [{ name: 'WelcomeScreen' as const }] };
            }

            if (isLockScreenEnabled) {
                return { routes: [{ name: 'LockScreen' as const }] };
            }

            return { routes: [{ name: 'TabsNavigator' as const }] };
        })()
    );

    return ref.current;
}
