import { useMutation, useQueryClient } from '@tanstack/react-query';

import { accountStorageKey } from './keys';
import { useAppContext, useAppSdk } from '../../shared';

export function useActiveAccount(): { id: string } | undefined {
    return {
        id: 'mock'
    };
}

export function useAccounts() {
    const { storage } = useAppSdk();

    return [
        {
            id: 'mock',
            syncProvider: storage.child('mock-accounts')
        }
    ];
}

export function useLogOutFromAllAccounts() {
    const { clearAllData } = useAppContext();
    const queryClient = useQueryClient();

    return useMutation({
        async mutationFn() {
            await clearAllData();

            queryClient.clear();
        }
    });
}

export function useActiveAccountQueryKey() {
    const account = useActiveAccount();
    return accountStorageKey.accountId(account?.id ?? null);
}
