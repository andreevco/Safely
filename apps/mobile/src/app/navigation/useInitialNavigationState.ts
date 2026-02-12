import { NavigationContainerProps } from '@react-navigation/native';
import { useRef } from 'react';

import { useHasAccount } from '@safely/ux';

import { usePasscode } from '@mobile/entities/security';

export function useInitialNavigationState(): NavigationContainerProps['initialState'] {
    const passcode = usePasscode();
    const hasAccount = useHasAccount();

    const ref = useRef(
        (() => {
            if (!passcode.isSet || !hasAccount) {
                return {
                    routes: [{ name: 'WelcomeScreen' as const }]
                };
            }

            return undefined;
        })()
    );

    return ref.current;
}
