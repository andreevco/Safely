import type { RampOrder } from '@safely/core';

import type { OrderActivityItem } from './types';

const ACTIVE_ORDER_STATUSES: ReadonlySet<RampOrder['status']> = new Set([
    'new',
    'pending',
    'processing'
]);

export function isRampOrderActive(order: Pick<RampOrder, 'status'>): boolean {
    return ACTIVE_ORDER_STATUSES.has(order.status);
}

export function rampOrderToActivityItem(order: RampOrder): OrderActivityItem {
    return {
        type: 'order',
        timestamp: order.createdAt * 1000,
        key: `order:${order.id}`,
        order
    };
}
