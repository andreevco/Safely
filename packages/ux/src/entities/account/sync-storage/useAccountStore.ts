import { useStore } from 'zustand';

import type { AccountState } from './account-store';
import { accountStore } from './account-store';

export function useAccountStore<T>(selector: (state: AccountState) => T): T {
    return useStore(accountStore, selector);
}
