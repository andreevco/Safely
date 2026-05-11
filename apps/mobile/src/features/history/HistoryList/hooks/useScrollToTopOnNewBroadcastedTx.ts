import { type RefObject, useEffect, useRef } from 'react';

import { useLastBroadcastedBtcTx } from '@safely/ux';

import { type ListRef } from '@mobile/shared/ui/Screen/components/List';

export function useScrollToTopOnNewBroadcastedTx<TItem>(
    listRef: RefObject<ListRef<TItem> | null>
): void {
    const broadcastedTx = useLastBroadcastedBtcTx();
    const prevBroadcastedTxIdRef = useRef<string | undefined>(broadcastedTx?.txId);

    useEffect(() => {
        async function scrollAndRecordInteraction() {
            await listRef.current?.scrollToIndex({
                index: 0,
                animated: true,
                viewPosition: 0
            });
            listRef.current?.recordInteraction();
        }
        const prev = prevBroadcastedTxIdRef.current;
        const next = broadcastedTx?.txId;
        if (next && next !== prev) {
            void scrollAndRecordInteraction();
        }
        prevBroadcastedTxIdRef.current = next;
    }, [broadcastedTx?.txId, listRef]);
}
