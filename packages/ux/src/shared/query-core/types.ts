import { CacheSchemaKey } from './cache-config';

export type PersistMeta = {
    persist: true;
    schemaKey: CacheSchemaKey;
};

export type WithIsActualised<T> = T & { isActualised: boolean };

export type WithPersistMeta<TOptions> = Omit<TOptions, 'meta'> & { meta: PersistMeta };

export type DerivedQueryResult<TData = unknown, TError = unknown> = {
    data: TData | undefined;
    isError: boolean;
    isSuccess: boolean;
    isPending: boolean;
    isFetching: boolean;
    error: TError | null;
    dataUpdatedAt: number;
    isActualised?: boolean;
    refetch: () => Promise<unknown>;
    promise?: Promise<TData>;
};
