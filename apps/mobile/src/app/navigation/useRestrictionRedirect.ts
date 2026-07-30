import { CommonActions } from '@react-navigation/native';
import { useEffect } from 'react';

import { useIsAppRestricted } from '@mobile/entities/restrictions';

import { navigationRef } from './navigationRef';

const ALLOWED_WHEN_RESTRICTED = ['RestrictedScreen', 'RestrictedRecoveryScreen', 'LockScreen'];

export function useRestrictionRedirect() {
    const isRestricted = useIsAppRestricted();

    useEffect(() => {
        if (!isRestricted || !navigationRef.isReady()) return;

        const currentRoute = navigationRef.getCurrentRoute()?.name;

        if (currentRoute !== undefined && ALLOWED_WHEN_RESTRICTED.includes(currentRoute)) return;

        navigationRef.dispatch(
            CommonActions.reset({
                index: 0,
                routes: [{ name: 'RestrictedScreen' }]
            })
        );
    }, [isRestricted]);
}
