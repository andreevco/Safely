import { useQueryClient } from '@tanstack/react-query';

import { notNullish } from '@safely/core';
import type { ISyncAccount } from '@safely/sync';
import { SyncAccountFactory } from '@safely/sync';
import type {
    SAccountMeta,
    SyncedStorageStructure,
    SyncedStorageVersions
} from '@safely/sync-storage';
import { syncedStorageVersions } from '@safely/sync-storage';

import { accountKey } from './keys';
import {
    type TranslateFn,
    useAppContext,
    useBootConfig,
    useSharedUxStorage,
    useSuspenseQuery,
    useTranslate
} from '../../shared';

export type AccountMeta = Exclude<SAccountMeta, null>;

export type SyncAccount = ISyncAccount<SyncedStorageStructure> & {
    meta: AccountMeta;
};

export type OnboardingConnector = {
    connectionString: string;
    accountPromise: Promise<ISyncAccount<SyncedStorageStructure>>;
    abort: () => void;
};

export const withMeta =
    (t: TranslateFn) =>
    (account: ISyncAccount<SyncedStorageStructure>): SyncAccount => {
        let meta = account.syncProvider.get('meta');
        if (!meta) {
            meta = { name: t('account.unnamed') };
        }

        (account as SyncAccount).meta = meta;
        return account as SyncAccount;
    };

let _syncAccountFactory: SyncAccountFactory<SyncedStorageVersions> | null = null;

export function resetAccountsFactory() {
    _syncAccountFactory = null;
}

export function useAccountsFactory() {
    const config = useBootConfig();
    const {
        storage: { sync },
        loggerRegistry
    } = useAppContext();

    if (!_syncAccountFactory) {
        _syncAccountFactory = new SyncAccountFactory({
            storage: sync.regular,
            encryptedStorage: sync.encrypted,
            versions: syncedStorageVersions,
            apiConfiguration: {
                basePath: config.sync.api_url
            },
            noAccountLogger: loggerRegistry.systemLogger.child('sync'),
            getAccountLogger: (accountId: string) => loggerRegistry.getAccountLogger(accountId)
        });
    }

    return _syncAccountFactory;
}

export function useAccountsQueryConfig() {
    const factory = useAccountsFactory();
    const t = useTranslate();

    return {
        queryKey: accountKey.list.toKey(),
        async queryFn(): Promise<SyncAccount[]> {
            const accounts = await factory.getSyncAccounts();
            return accounts.map(withMeta(t));
        },
        staleTime: Infinity
    };
}

export function useAccounts() {
    const query = useAccountsQueryConfig();

    return useSuspenseQuery(query).data;
}

export function useActiveAccountQuery() {
    const { set, get } = useSharedUxStorage('activeAccount');
    const client = useQueryClient();
    const accountsQueryConfig = useAccountsQueryConfig();

    return useSuspenseQuery({
        queryKey: accountKey.list.active.toKey(),
        async queryFn() {
            const activeId = await get();
            const accounts = await client.fetchQuery({ ...accountsQueryConfig, staleTime: 0 });
            let activeAccount = accounts.find(k => k.accountId === activeId);

            if (!activeAccount) {
                if (accounts.length === 0) {
                    return null;
                } else {
                    activeAccount = accounts[0];
                    await set(activeAccount.accountId);
                }
            }

            return activeAccount;
        },
        staleTime: Infinity
    });
}

export function useHasAccount() {
    const { data: activeAccount } = useActiveAccountQuery();
    return notNullish(activeAccount);
}

export function useActiveAccount() {
    const { data: activeAccount } = useActiveAccountQuery();
    if (activeAccount === null) {
        throw new Error('Account id not found');
    }

    return activeAccount;
}

export function useActiveAccountQueryKey() {
    const { data: activeAccount } = useActiveAccountQuery();
    return accountKey.accountId(activeAccount?.accountId);
}
