import { accountStorageKey } from './keys';
import { useAppSdk } from '../../shared';

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

export function useActiveAccountQueryKey() {
    const account = useActiveAccount();
    return accountStorageKey.accountId(account?.id ?? null);
}
