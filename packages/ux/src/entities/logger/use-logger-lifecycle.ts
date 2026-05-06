import { useEffect, useMemo } from 'react';

import { useAppContext } from '../../shared';
import { useAccounts, useActiveAccountQuery } from '../account/account-state';

export function useLoggerLifecycle(): void {
    const { loggerRegistry, subscribeAppStateChange } = useAppContext();
    const accounts = useAccounts();
    const { data: activeAccount } = useActiveAccountQuery();

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
        loggerRegistry.setActiveAccountId(activeAccount?.accountId ?? null);
    }, [loggerRegistry, activeAccount?.accountId]);

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
