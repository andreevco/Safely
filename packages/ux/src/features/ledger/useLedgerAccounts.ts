import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { BtcNetwork, LedgerController, ledgerAccountToBtcWallet } from '@safely/core';

import { ledgerKeys } from './keys';
import { useLedgerSession } from './LedgerSessionProvider';
import { useBtcConfirmedBalances } from '../../entities/btc-blockchain';

const ACCOUNT_COUNT = 10;
const DERIVATIONS_SEARCH_TIMEOUT = 20_000;

export const useLedgerAccounts = () => {
    const { getLedgerKit, sessionId, setSessionId, selectedDevice } = useLedgerSession();

    const { data, isError } = useQuery({
        queryKey: ledgerKeys.accounts(selectedDevice?.id).toKey(),
        enabled: sessionId !== null,
        staleTime: Infinity,
        retry: false,
        queryFn: async () => {
            const ledger = new LedgerController(getLedgerKit(), sessionId ?? '');

            const accounts = await ledger.discoverAccounts({ count: ACCOUNT_COUNT });
            const masterFingerprint = await ledger.getMasterFingerprint();

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
    const balances = useBtcConfirmedBalances(wallets);

    const [isTimedOut, setIsTimedOut] = useState(false);

    useEffect(() => {
        if (!isLoading) {
            setIsTimedOut(false);

            return;
        }

        const id = setTimeout(() => setIsTimedOut(true), DERIVATIONS_SEARCH_TIMEOUT);

        return () => clearTimeout(id);
    }, [isLoading]);

    const retry = useCallback(async (): Promise<boolean> => {
        if (sessionId) {
            await getLedgerKit()
                .disconnect({ sessionId })
                .catch(() => {});
            setSessionId(null);
        }

        return false;
    }, [sessionId, getLedgerKit, setSessionId]);

    return { accounts, balances, masterFingerprint, retry, isLoading, isError, isTimedOut };
};
