import { isBtcTransactionPending } from './blockchain-specific/btc';
import { isRampOrderActive } from './onramp';
import type { ActivityItem } from './types';
import { isBtcActivityItem } from './types';

export function isActivityItemPending(item: ActivityItem): boolean {
    return isBtcActivityItem(item)
        ? isBtcTransactionPending(item.transaction.raw)
        : isRampOrderActive(item.order);
}
