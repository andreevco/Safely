import { useMutation, useQueryClient } from '@tanstack/react-query';

import { accountStorageKey } from './keys';
import { useAppContext, useAppSdk } from '../../shared';

export function useActiveAccount(): { id: string; name: string } | undefined {
    return {
        id: 'mock',
        name: 'Main'
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

export function useSignOutFromAccount() {
    const { clearAllData } = useAppContext();
    const queryClient = useQueryClient();

    return useMutation({
        async mutationFn() {
            await clearAllData(); // TODO

            queryClient.clear();
        }
    });
}

export function useSignOutFromAllAccounts() {
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
