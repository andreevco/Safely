import {
    QueryKey,
    useQuery,
    UseQueryOptions,
    UseSuspenseQueryOptions,
    UseSuspenseQueryResult
} from '@tanstack/react-query';

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
        // eslint-disable-next-line @typescript-eslint/only-throw-error
        throw result.refetch();
    }

    return result;
}
