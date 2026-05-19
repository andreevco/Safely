import { useStore } from 'zustand';

import type { AccountState, AccountStoreData, SyncedSlotKey } from './account-store';
import { accountStore } from './account-store';

export function useAccountStore<T>(selector: (state: AccountState) => T): T {
    return useStore(accountStore, selector);
}

export function useAccountStoreSlot<K extends SyncedSlotKey>(
    accountId: string | null,
    key: K
): AccountStoreData[K] | undefined {
    return useAccountStore(s => (accountId ? s.accountsData.get(accountId)?.[key] : undefined));
}
