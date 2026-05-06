import { useQueryClient } from '@tanstack/react-query';

import { notNullish } from '@safely/core';
import { ISyncAccount, SyncAccountFactory } from '@safely/sync';

import { accountKey } from './keys';
import {
    AccountMeta,
    syncedStorageStructure,
    SyncedStorageStructure,
    useAppContext,
    useBootConfig,
    useSharedUxStorage,
    useSuspenseQuery
} from '../../shared';

export type SyncAccount = ISyncAccount<SyncedStorageStructure> & {
    meta: AccountMeta;
};

export type OnboardingConnector = {
    connectionString: string;
    accountPromise: Promise<ISyncAccount<SyncedStorageStructure>>;
    abort: () => void;
};

export function generateAccountMeta(accountId: string, name?: string) {
    return {
        name: name ?? `Account ${accountId.slice(-6)}`,
        icon: {
            type: 'color' as const,
            value:
                '#' +
                Math.floor(Number(`0x${accountId.slice(-6)}`))
                    .toString(16)
                    .padStart(6, '0')
        }
    };
}

export function withMeta(account: ISyncAccount<SyncedStorageStructure>): SyncAccount {
    let meta = account.syncProvider.get('meta');
    if (!meta) {
        meta = generateAccountMeta(account.accountId);
    }

    (account as SyncAccount).meta = meta;
    return account as SyncAccount;
}

let _syncAccountFactory: SyncAccountFactory<SyncedStorageStructure> | null = null;

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
            structure: syncedStorageStructure,
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

    return {
        queryKey: accountKey.list.toKey(),
        async queryFn() {
            const accounts = await factory.getSyncAccounts();
            return accounts.map(withMeta);
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
