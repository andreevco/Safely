import type { QueryKey, UseSuspenseQueryResult } from '@tanstack/react-query';

import type { SuspenseQueryOptions } from './useSuspenseQuery';
import { useSuspenseQuery } from './useSuspenseQuery';
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
    options: WithPersistMeta<SuspenseQueryOptions<TQueryFnData, TError, TData, TQueryKey>>
): PersistSuspenseQueryResult<TData, TError> {
    const { schemaKey, ...rest } = options;
    const hydratedAt = useHydratedAt();
    const result = useSuspenseQuery({
        ...rest,
        meta: { persist: true, schemaKey }
    });

    return useIsActualised(result, hydratedAt);
}
