import type { InfiniteData } from '@tanstack/react-query';

import type { ActivityPage, IActivityPageParam } from './types';
import { isOrderActivityItem } from './types';
import { useHistory } from './useHistory';

const EMPTY_TXIDS: ReadonlySet<string> = new Set();

const selectOnrampTxids = (
    data: InfiniteData<ActivityPage, IActivityPageParam>
): ReadonlySet<string> => {
    const txids = new Set<string>();

    for (const page of data.pages) {
        for (const item of page.items) {
            if (isOrderActivityItem(item) && item.order.type === 'onramp' && item.order.txHash) {
                txids.add(item.order.txHash);
            }
        }
    }

    return txids;
};

export function useOnrampTxids(): ReadonlySet<string> {
    const { data } = useHistory({ isInitiator: false }, { select: selectOnrampTxids });

    return data ?? EMPTY_TXIDS;
}
