import type { StoreApi } from 'zustand/vanilla';
import { createStore } from 'zustand/vanilla';

import type { Contact, FiatAsset, Portfolio } from '@safely/core';
import type { SAccountMeta, SDevicesMeta } from '@safely/sync-storage';

export type AccountStoreData = {
    accountId: string;
    meta: SAccountMeta;
    portfolios: Portfolio[];
    contacts: Contact[];
    preferredFiat: FiatAsset | null;
    devicesMeta: SDevicesMeta;
};

export const SYNCED_SLOT_KEYS = [
    'meta',
    'portfolios',
    'contacts',
    'preferredFiat',
    'devicesMeta'
] as const satisfies readonly (keyof Omit<AccountStoreData, 'accountId'>)[];

export type SyncedSlotKey = (typeof SYNCED_SLOT_KEYS)[number];

export type AccountState = {
    active: AccountStoreData | null;
};

export type AccountStore = StoreApi<AccountState>;

export function createAccountStore(): AccountStore {
    return createStore<AccountState>(() => ({
        active: null
    }));
}

export const accountStore: AccountStore = createAccountStore();

export type AccountStoreActions = {
    attachSnapshot(snapshot: AccountStoreData): void;
    setSlot<K extends SyncedSlotKey>(key: K, value: AccountStoreData[K]): void;
    clear(): void;
};

export const accountStoreActions: AccountStoreActions = {
    attachSnapshot(snapshot) {
        accountStore.setState({ active: snapshot });
    },

    setSlot(key, value) {
        accountStore.setState(state => {
            if (!state.active) return state;
            return { active: { ...state.active, [key]: value } };
        });
    },

    clear() {
        accountStore.setState({ active: null });
    }
};
