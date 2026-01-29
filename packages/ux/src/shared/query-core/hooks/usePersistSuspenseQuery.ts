import {
    QueryKey,
    useSuspenseQuery,
    UseSuspenseQueryOptions,
    UseSuspenseQueryResult
} from '@tanstack/react-query';

import { useHydratedAt } from '../../contexts';
import { useIsActualised } from '../persist-helpers';
import type { WithIsActualised, WithPersistMeta } from '../types';

type PersistSuspenseQueryResult<TData = unknown, TError = unknown> = WithIsActualised<
    UseSuspenseQueryResult<TData, TError>
>;

export function usePersistSuspenseQuery<
    TQueryFnData = unknown,
    TError = unknown,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey
>(
    options: WithPersistMeta<UseSuspenseQueryOptions<TQueryFnData, TError, TData, TQueryKey>>
): PersistSuspenseQueryResult<TData, TError> {
    const hydratedAt = useHydratedAt();
    const result = useSuspenseQuery(options);

    return useIsActualised(result, hydratedAt);
}
