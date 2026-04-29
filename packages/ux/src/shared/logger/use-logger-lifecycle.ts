import { useEffect, useMemo } from 'react';

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

    useEffect(() => {
        const accountIds = accounts.map(a => a.accountId);
        void loggerRegistry.onAccountsChanged({ accountIds });
    }, [accountIdsKey, loggerRegistry]);

    useEffect(() => {
        return () => {
            void loggerRegistry.onBeforeAppClosed();
        };
    }, [loggerRegistry]);

    useEffect(() => {
        return subscribeAppStateChange(state => {
            if (state === 'background' || state === 'inactive') {
                void loggerRegistry.onBeforeAppClosed();
            }
        });
    }, [subscribeAppStateChange, loggerRegistry]);
}
