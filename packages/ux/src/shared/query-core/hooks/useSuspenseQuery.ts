import {
    QueryKey,
    useQuery,
    UseQueryOptions,
    UseSuspenseQueryOptions,
    UseSuspenseQueryResult
} from '@tanstack/react-query';
import { use } from 'react';

export function useSuspenseQuery<
    TQueryFnData = unknown,
    TError = Error,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey
>(
    options: UseSuspenseQueryOptions<TQueryFnData, TError, TData, TQueryKey> &
        Pick<UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>, 'placeholderData'>
): UseSuspenseQueryResult<TData, TError> {
    const result = useQuery(options) as UseSuspenseQueryResult<TData, TError>;

    if (result.data === undefined) {
        use(result.refetch());
    }

    return result;
}
