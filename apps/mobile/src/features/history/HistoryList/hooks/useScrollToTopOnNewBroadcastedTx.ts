import { type RefObject, useEffect, useRef } from 'react';

import { useLastBroadcastedBtcTx } from '@safely/ux';

import { type ListRef } from '@mobile/shared/ui/Screen/components/List';

export function useScrollToTopOnNewBroadcastedTx<TItem>(
    listRef: RefObject<ListRef<TItem> | null>
): void {
    const broadcastedTx = useLastBroadcastedBtcTx();
    const prevBroadcastedTxIdRef = useRef<string | undefined>(broadcastedTx?.txId);

    useEffect(() => {
        const prev = prevBroadcastedTxIdRef.current;
        const next = broadcastedTx?.txId;
        if (next && next !== prev) {
            listRef.current?.scrollToTop();
        }
        prevBroadcastedTxIdRef.current = next;
    }, [broadcastedTx?.txId, listRef]);
}
