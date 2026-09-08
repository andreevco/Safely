import type { StoreApi } from 'zustand/vanilla';
import { createStore } from 'zustand/vanilla';

import type { Contact, FiatAsset, Portfolio } from '@safely/core';
import type {
    SAccountMeta,
    SAmountDisplay,
    SDevicesMeta,
    SDevicesArchive,
    SDevicesSyncState,
    SNextDerivingPortfolioInfo
} from '@safely/sync-storage';

export type AccountStoreData = {
    accountId: string;
    meta: SAccountMeta;
    portfolios: Portfolio[];
    contacts: Contact[];
    preferredFiat: FiatAsset | null;
    devicesMeta: SDevicesMeta;
    devicesSyncState: SDevicesSyncState;
    devicesArchive: SDevicesArchive;
    nextDerivingPortfolioInfo: SNextDerivingPortfolioInfo;
    analyticsId: string | null;
    amountDisplay: SAmountDisplay;
};

export const SYNCED_SLOT_KEYS = [
    'meta',
    'portfolios',
    'contacts',
    'preferredFiat',
    'devicesMeta',
    'devicesSyncState',
    'devicesArchive',
    'nextDerivingPortfolioInfo',
    'analyticsId',
    'amountDisplay'
] as const satisfies readonly (keyof Omit<AccountStoreData, 'accountId'>)[];

export type SyncedSlotKey = (typeof SYNCED_SLOT_KEYS)[number];

export type AccountState = {
    accountsData: ReadonlyMap<string, AccountStoreData>;
};

export type AccountStore = StoreApi<AccountState>;

export function createAccountStore(): AccountStore {
    return createStore<AccountState>(() => ({
        accountsData: new Map()
    }));
}

export const accountStore: AccountStore = createAccountStore();

export type AccountStoreActions = {
    attachSnapshot(snapshot: AccountStoreData): void;
    setSlot<K extends SyncedSlotKey>(accountId: string, key: K, value: AccountStoreData[K]): void;
    retainAccounts(accountIds: ReadonlySet<string>): void;
    removeAccount(accountId: string): void;
    clear(): void;
};

export const accountStoreActions: AccountStoreActions = {
    attachSnapshot(snapshot) {
        accountStore.setState(state => {
            const next = new Map(state.accountsData);
            next.set(snapshot.accountId, snapshot);
            return { accountsData: next };
        });
    },

    setSlot(accountId, key, value) {
        accountStore.setState(state => {
            const current = state.accountsData.get(accountId);
            if (!current) return state;
            const next = new Map(state.accountsData);
            next.set(accountId, { ...current, [key]: value });
            return { accountsData: next };
        });
    },

    retainAccounts(accountIds) {
        accountStore.setState(state => {
            let changed = false;
            const next = new Map(state.accountsData);
            for (const id of next.keys()) {
                if (!accountIds.has(id)) {
                    next.delete(id);
                    changed = true;
                }
            }
            if (!changed) return state;
            return { accountsData: next };
        });
    },

    removeAccount(accountId) {
        accountStore.setState(state => {
            if (!state.accountsData.has(accountId)) return state;
            const next = new Map(state.accountsData);
            next.delete(accountId);
            return { accountsData: next };
        });
    },

    clear() {
        accountStore.setState({ accountsData: new Map() });
    }
};
