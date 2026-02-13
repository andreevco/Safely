import { NavigationContainerProps } from '@react-navigation/native';
import { useRef } from 'react';

import { useHasAccount } from '@safely/ux';

import { usePasscode } from '@mobile/entities/security';

export function useInitialNavigationState(): NavigationContainerProps['initialState'] {
    const hasAccount = useHasAccount();
    const { isSet: hasPasscode } = usePasscode();

    const ref = useRef(
        (() => {
            if (!hasPasscode || !hasAccount) {
                return { routes: [{ name: 'WelcomeScreen' as const }] };
            }

            return undefined;
        })()
    );

    return ref.current;
}
