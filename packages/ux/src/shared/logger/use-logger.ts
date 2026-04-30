import { useMemo } from 'react';

import { Logger } from '@safely/sync';

import { useActiveAccountQuery } from '../../entities';
import { useAppContext } from '../providers';

export function useLogger(): Logger {
    const { loggerRegistry } = useAppContext();
    const { data: activeAccount } = useActiveAccountQuery();

    return useMemo(() => {
        return activeAccount
            ? loggerRegistry.getAccountLogger(activeAccount.accountId)
            : loggerRegistry.systemLogger;
    }, [loggerRegistry, activeAccount?.accountId]);
}
