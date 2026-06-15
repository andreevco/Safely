import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
    BtcNetwork,
    discoverLedgerAccounts,
    getLedgerMasterFingerprint,
    isLedgerSessionConnected,
    ledgerAccountToBtcWallet
} from '@safely/core';
import { useBtcWalletBalances } from '@safely/ux';

import { ledgerKeys } from './keys';
import { useLedgerSession } from './LedgerSigningProvider';

const ACCOUNT_COUNT = 10;
const DERIVATIONS_SEARCH_TIMEOUT = 20_000;

export const useLedgerAccounts = (options?: { lockedIndexes?: number[] }) => {
    const { getDmk, sessionId, selectedDevice } = useLedgerSession();
    const lockedIndexes = useMemo(
        () => new Set(options?.lockedIndexes ?? []),
        [options?.lockedIndexes]
    );
    const [selectedIndexes, setSelectedIndexes] = useState<Set<number>>(
        () => new Set(lockedIndexes)
    );
    const hasPreselected = useRef(false);

    const { data, isError, refetch } = useQuery({
        queryKey: ledgerKeys.accounts(selectedDevice?.id).toKey(),
        enabled: sessionId !== null,
        staleTime: Infinity,
        retry: false,
        queryFn: () => discoverLedgerAccounts(getDmk(), sessionId ?? '', { count: ACCOUNT_COUNT })
    });

    const accounts = data ?? [];
    const isLoading = !data && !isError;

    const wallets = useMemo(
        () => accounts.map(account => ledgerAccountToBtcWallet(account, BtcNetwork.MAINNET)),
        [accounts]
    );
    const walletBalances = useBtcWalletBalances(wallets);
    const balances = walletBalances.map(balance => balance?.display);

    const [isTimedOut, setIsTimedOut] = useState(false);

    useEffect(() => {
        if (!isLoading) {
            setIsTimedOut(false);

            return;
        }

        const id = setTimeout(() => setIsTimedOut(true), DERIVATIONS_SEARCH_TIMEOUT);

        return () => clearTimeout(id);
    }, [isLoading]);

    useEffect(() => {
        if (hasPreselected.current || accounts.length === 0 || lockedIndexes.size > 0) {
            return;
        }

        if (balances.some(balance => balance === undefined)) {
            return;
        }

        hasPreselected.current = true;

        const fundedIndexes = accounts
            .filter((_, i) => (balances[i]?.weiAmount ?? 0n) > 0n)
            .map(account => account.index);

        if (fundedIndexes.length > 0) {
            setSelectedIndexes(new Set(fundedIndexes));
        }
    }, [accounts, balances, lockedIndexes]);

    const toggle = useCallback(
        (index: number) => {
            if (lockedIndexes.has(index)) {
                return;
            }

            setSelectedIndexes(prev => {
                const next = new Set(prev);

                if (next.has(index)) {
                    next.delete(index);
                } else {
                    next.add(index);
                }

                return next;
            });
        },
        [lockedIndexes]
    );

    const readMasterFingerprint = useCallback(
        (): Promise<string> => getLedgerMasterFingerprint(getDmk(), sessionId ?? ''),
        [getDmk, sessionId]
    );

    const retry = useCallback(async (): Promise<boolean> => {
        if (sessionId && (await isLedgerSessionConnected(getDmk(), sessionId))) {
            setIsTimedOut(false);
            await refetch();

            return true;
        }

        return false;
    }, [sessionId, getDmk, refetch]);

    const selectedAccounts = accounts
        .filter(account => selectedIndexes.has(account.index))
        .map(account => ({ index: account.index, xpub: account.xpub }));

    return {
        accounts,
        balances,
        selectedIndexes,
        lockedIndexes,
        selectedAccounts,
        toggle,
        readMasterFingerprint,
        retry,
        isLoading,
        isError,
        isTimedOut
    };
};
