import { useMemo } from 'react';

import type { Logger } from '@safely/sync';

import { useAppContext } from '../../shared';
import { useActiveAccountQuery } from '../account/account-state';

export function useLogger(): Logger {
    const { loggerRegistry } = useAppContext();
    const { data: activeAccount } = useActiveAccountQuery();

    return useMemo(() => {
        return activeAccount
            ? loggerRegistry.getAccountLogger(activeAccount.accountId)
            : loggerRegistry.systemLogger;
    }, [loggerRegistry, activeAccount?.accountId]);
}
