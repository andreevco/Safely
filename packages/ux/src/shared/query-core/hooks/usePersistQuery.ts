import { QueryKey, useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';

import { useHydratedAt } from '../../contexts';
import { useIsActualised } from '../persist-helpers';
import type { WithIsActualised, WithPersistMeta } from '../types';

type PersistQueryResult<TData = unknown, TError = unknown> = WithIsActualised<
    UseQueryResult<TData, TError>
>;

export function usePersistQuery<
    TQueryFnData = unknown,
    TError = unknown,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey
>(
    options: WithPersistMeta<UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>>
): PersistQueryResult<TData, TError> {
    const hydratedAt = useHydratedAt();
    const result = useQuery(options);

    return useIsActualised(result, hydratedAt);
}
