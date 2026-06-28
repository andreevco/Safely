import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
    BtcNetwork,
    discoverLedgerAccounts,
    getLedgerMasterFingerprint,
    ledgerAccountToBtcWallet
} from '@safely/core';
import { useBtcWalletBalances } from '@safely/ux';

import { ledgerKeys } from './keys';
import { useLedgerSession } from './LedgerSigningProvider';

const ACCOUNT_COUNT = 10;
const DERIVATIONS_SEARCH_TIMEOUT = 20_000;

export const useLedgerAccounts = (options?: { existingIndexes?: number[] }) => {
    const { getLedgerKit, sessionId, setSessionId, selectedDevice } = useLedgerSession();
    const existingIndexes = useMemo(
        () => new Set(options?.existingIndexes ?? []),
        [options?.existingIndexes]
    );
    const [selectedIndexes, setSelectedIndexes] = useState<Set<number>>(
        () => new Set(existingIndexes)
    );
    const hasPreselected = useRef(false);

    const { data, isError } = useQuery({
        queryKey: ledgerKeys.accounts(selectedDevice?.id).toKey(),
        enabled: sessionId !== null,
        staleTime: Infinity,
        retry: false,
        queryFn: async () => {
            const accounts = await discoverLedgerAccounts(getLedgerKit(), sessionId ?? '', {
                count: ACCOUNT_COUNT
            });
            const masterFingerprint = await getLedgerMasterFingerprint(
                getLedgerKit(),
                sessionId ?? ''
            );

            return { accounts, masterFingerprint };
        }
    });

    const accounts = data?.accounts ?? [];
    const masterFingerprint = data?.masterFingerprint;
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
        if (hasPreselected.current || accounts.length === 0) {
            return;
        }

        if (balances.some(balance => balance === undefined)) {
            return;
        }

        hasPreselected.current = true;

        const fundedIndexes = accounts
            .filter((_, i) => (balances[i]?.weiAmount ?? 0n) > 0n)
            .map(account => account.index);

        setSelectedIndexes(new Set([...existingIndexes, ...fundedIndexes]));
    }, [accounts, balances, existingIndexes]);

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

    const retry = useCallback(async (): Promise<boolean> => {
        if (sessionId) {
            await getLedgerKit()
                .disconnect({ sessionId })
                .catch(() => {});
            setSessionId(null);
        }

        return false;
    }, [sessionId, getLedgerKit, setSessionId]);

    const selectedAccounts = accounts
        .filter(account => selectedIndexes.has(account.index))
        .map(account => ({ index: account.index, xpub: account.xpub }));

    return {
        accounts,
        balances,
        masterFingerprint,
        selectedIndexes,
        selectedAccounts,
        toggle,
        retry,
        isLoading,
        isError,
        isTimedOut
    };
};
