import { useInfiniteQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';

import { discoverLedgerAccounts } from '@safely/core';
import { useBtcApi } from '@safely/ux';

import { useLedgerSession } from './LedgerSessionProvider';

const BATCH_SIZE = 5;

const isSessionLost = (error: unknown): boolean => {
    if (typeof error === 'object' && error !== null && '_tag' in error) {
        return (error as { _tag?: unknown })._tag === 'DeviceSessionNotFound';
    }

    return String(error).includes('DeviceSessionNotFound');
};

export const useLedgerAccounts = () => {
    const { getDmk, sessionId, selectedDevice, reconnect } = useLedgerSession();
    const btcApi = useBtcApi();
    const [selectedIndexes, setSelectedIndexes] = useState<Set<number>>(new Set());
    const preselectedCount = useRef(0);

    const { data, isLoading, isFetchingNextPage, fetchNextPage } = useInfiniteQuery({
        queryKey: ['ledger-accounts', selectedDevice?.id],
        enabled: sessionId !== null,
        initialPageParam: 0,
        staleTime: Infinity,
        retry: false,
        queryFn: async ({ pageParam }) => {
            const read = (id: string) =>
                discoverLedgerAccounts(getDmk(), id, btcApi, pageParam, BATCH_SIZE);

            try {
                return await read(sessionId ?? '');
            } catch (error) {
                if (!isSessionLost(error)) {
                    throw error;
                }

                return read(await reconnect());
            }
        },
        getNextPageParam: (_lastPage, allPages) => allPages.length * BATCH_SIZE
    });

    const accounts = data?.pages.flat() ?? [];

    useEffect(() => {
        if (accounts.length <= preselectedCount.current) {
            return;
        }

        const fundedIndexes = accounts
            .slice(preselectedCount.current)
            .filter(account => account.balance > 0n)
            .map(account => account.index);
        preselectedCount.current = accounts.length;

        if (fundedIndexes.length > 0) {
            setSelectedIndexes(prev => new Set([...prev, ...fundedIndexes]));
        }
    }, [accounts]);

    const toggle = useCallback((index: number) => {
        setSelectedIndexes(prev => {
            const next = new Set(prev);

            if (next.has(index)) {
                next.delete(index);
            } else {
                next.add(index);
            }

            return next;
        });
    }, []);

    const showNext = useCallback(() => {
        void fetchNextPage();
    }, [fetchNextPage]);

    return {
        accounts,
        selectedIndexes,
        toggle,
        showNext,
        isLoading,
        isLoadingMore: isFetchingNextPage
    };
};
