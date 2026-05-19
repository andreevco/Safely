import { useQuery } from '@tanstack/react-query';

import { deriveAnalyticsAccountUuid } from '@safely/core';

import { analyticsKeys } from './keys';
import { useAppContext } from '../../shared/providers';
import { useActiveAccountQuery } from '../account/account-state';

export function useAccountUuid() {
    const appContext = useAppContext();
    const { data: activeAccount } = useActiveAccountQuery();
    const getSecureEncrypted = appContext.storage.sync.getSecureEncrypted;

    return useQuery({
        queryKey: analyticsKeys.accountUuid(activeAccount?.accountId ?? '').toKey(),
        queryFn: async () => {
            if (!activeAccount) return null;

            using secureStorage = getSecureEncrypted();
            secureStorage.UNSAFE_SKIP_SECURITY_CHECK_unlock();

            return await activeAccount.withMasterKey(secureStorage, mk =>
                deriveAnalyticsAccountUuid(mk)
            );
        },
        enabled: !!activeAccount,
        staleTime: Infinity
    });
}
