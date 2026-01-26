import { useCallback, useMemo } from 'react';

import { DerivedQueryResult } from './types';

export function aggregateFlags(queries: readonly DerivedQueryResult[]) {
    const isError = queries.some(q => q.isError);
    const isSuccess = queries.every(q => q.isSuccess);
    const isPending = queries.some(q => q.isPending);
    const isFetching = queries.some(q => q.isFetching);
    const error = queries.find(q => q.error)?.error ?? null;

    return { isError, isSuccess, isPending, isFetching, error };
}

export const minUpdatedAt = (queries: readonly DerivedQueryResult[]) =>
    Math.min(...queries.map(q => q.dataUpdatedAt || Infinity));

export const allActualised = (queries: readonly DerivedQueryResult[]) =>
    queries.every(q => q.isActualised !== false);

export const useRefetchAll = (queries: readonly DerivedQueryResult[]) =>
    useCallback(() => Promise.all(queries.map(q => q.refetch())), [queries]);

export const usePromises = <TResult>(queries: readonly DerivedQueryResult<TResult>[]) =>
    useMemo(
        () => queries.map(q => q.promise ?? q.refetch().then(() => q.data as TResult)),
        [queries]
    );
