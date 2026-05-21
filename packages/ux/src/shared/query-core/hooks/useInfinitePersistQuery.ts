import type {
    QueryKey,
    UseInfiniteQueryOptions,
    UseInfiniteQueryResult
} from '@tanstack/react-query';
import { useInfiniteQuery } from '@tanstack/react-query';

import { useHydratedAt } from '../../contexts';
import { useIsActualised } from '../persist-helpers';
import type { WithIsActualised, WithPersistMeta } from '../types';

type PersistInfiniteQueryResult<TData = unknown, TError = unknown> = WithIsActualised<
    UseInfiniteQueryResult<TData, TError>
>;

export function useInfinitePersistQuery<
    TQueryFnData = unknown,
    TError = unknown,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
    TPageParam = unknown
>(
    options: WithPersistMeta<
        UseInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>
    >
): PersistInfiniteQueryResult<TData, TError> {
    const hydratedAt = useHydratedAt();
    const { schemaKey, meta, ...rest } = options;
    const result = useInfiniteQuery({ ...rest, meta: { ...meta, persist: true, schemaKey } });

    return useIsActualised(result, hydratedAt);
}
