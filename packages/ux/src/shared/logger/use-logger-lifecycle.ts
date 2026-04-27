import { useEffect, useMemo, useRef } from 'react';

import { useAccounts } from '../../entities';
import { useAppContext } from '../providers';

export function useLoggerLifecycle(): void {
    const { loggerRegistry, subscribeAppStateChange } = useAppContext();
    const accounts = useAccounts();

    const accountIdsKey = useMemo(
        () =>
            accounts
                .map(a => a.accountId)
                .sort()
                .join(','),
        [accounts]
    );

    const accountIdsRef = useRef<readonly string[]>([]);
    accountIdsRef.current = accounts.map(a => a.accountId);

    useEffect(() => {
        const accountIds = accounts.map(a => a.accountId);
        void loggerRegistry.onAfterAppOpened({ accountIds });
        // accounts is intentionally captured via accountIdsKey to avoid array identity churn
    }, [accountIdsKey, loggerRegistry]);

    useEffect(() => {
        return () => {
            void loggerRegistry.onBeforeAppClosed({ accountIds: accountIdsRef.current });
        };
    }, [loggerRegistry]);

    useEffect(() => {
        return subscribeAppStateChange(state => {
            if (state === 'background' || state === 'inactive') {
                void loggerRegistry.onBeforeAppClosed({ accountIds: accountIdsRef.current });
            }
        });
    }, [subscribeAppStateChange, loggerRegistry]);
}
