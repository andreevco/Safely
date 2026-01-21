import { useMemo } from 'react';

import {
    aggregateFlags,
    allActualised,
    minUpdatedAt,
    usePromises,
    useRefetchAll
} from '../derived-helpers';
import { DerivedQueryResult } from '../types';

export type DataTuple<Qs extends readonly DerivedQueryResult[]> = {
    [K in keyof Qs]: Qs[K] extends DerivedQueryResult<infer D> ? D : never;
};

export function useDerivedQuery<
    const Qs extends readonly DerivedQueryResult[],
    TQueryData,
    TData = TQueryData
>({
    queries,
    queryFn,
    select
}: {
    queries: Qs;
    queryFn: (queriesData: DataTuple<Qs>) => TQueryData;
    select?: (data: TQueryData) => TData;
}): DerivedQueryResult<TData> {
    const { isError, isSuccess, isPending, isFetching, error } = aggregateFlags(queries);
    const dataUpdatedAt = minUpdatedAt(queries);
    const isActualised = allActualised(queries);

    const tuple = queries.map(q => q.data) as DataTuple<Qs>;
    const data = useMemo(() => {
        if (!isSuccess) return undefined;

        const computed = queryFn(tuple);

        return select ? select(computed) : (computed as unknown as TData);
    }, [isSuccess, queryFn, select, ...tuple]);

    const refetch = useRefetchAll(queries) as () => Promise<unknown[]>;

    const promises = usePromises(queries);
    const promise = useMemo(async () => {
        const resolved = await Promise.all(promises);
        const computed = queryFn(resolved as DataTuple<Qs>);
        return select ? select(computed) : (computed as unknown as TData);
    }, [queryFn, select, ...promises]);

    return useMemo(
        () => ({
            data,
            isError,
            isSuccess,
            isPending,
            isFetching,
            error,
            dataUpdatedAt,
            isActualised,
            refetch,
            promise
        }),
        [
            data,
            isError,
            isSuccess,
            isPending,
            isFetching,
            error,
            dataUpdatedAt,
            isActualised,
            refetch,
            promise
        ]
    );
}
