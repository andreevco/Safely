import { useCallback, useEffect, useRef, useState } from 'react';

import type { BtcAssetAmount, LedgerAccount } from '@safely/core';

export const useLedgerAccountSelection = (params: {
    accounts: LedgerAccount[];
    balances: (BtcAssetAmount | undefined)[];
    preselectedIndexes?: number[];
}) => {
    const { accounts, balances, preselectedIndexes } = params;

    const [selectedIndexes, setSelectedIndexes] = useState<Set<number>>(() => new Set());
    const hasPreselected = useRef(false);

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

        setSelectedIndexes(new Set([...(preselectedIndexes ?? []), ...fundedIndexes]));
    }, [accounts, balances, preselectedIndexes]);

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

    const selectedAccounts = accounts
        .filter(account => selectedIndexes.has(account.index))
        .map(account => ({ index: account.index, xpub: account.xpub }));

    return { selectedIndexes, selectedAccounts, toggle };
};
