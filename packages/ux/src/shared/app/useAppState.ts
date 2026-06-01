import { useEffect, useState } from 'react';

import type { AppStateStatus } from '../providers/AppContext';
import { useAppContext } from '../providers/AppContext';

export function useAppState() {
    const { subscribeAppStateChange } = useAppContext();
    const [state, setState] = useState<{
        current: AppStateStatus;
        previous: AppStateStatus | undefined;
    }>({
        current: 'unknown',
        previous: undefined
    });

    useEffect(() => {
        return subscribeAppStateChange(next => {
            setState(prev => ({ current: next, previous: prev.current }));
        });
    }, [subscribeAppStateChange]);

    return state;
}
