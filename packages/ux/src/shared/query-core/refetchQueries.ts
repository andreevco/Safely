import { QueryClient, QueryKey } from '@tanstack/react-query';

export function refetchQueries(queryClient: QueryClient, queryKey: QueryKey) {
    return queryClient.refetchQueries({
        queryKey,
        predicate: query =>
            query.meta?.persist !== true || typeof query.options.queryFn === 'function'
    });
}
